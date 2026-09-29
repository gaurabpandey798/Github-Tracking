package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.FreezeResultItem;
import com.ideax.codemonitor.dto.FreezeSprintResponse;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.exception.InvalidStateTransitionException;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.GithubRepositoryService;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CheckpointService {

    private static final Logger log = LoggerFactory.getLogger(CheckpointService.class);

    private final SprintRepository sprintRepository;
    private final TeamRepository teamRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final CheckpointRepository checkpointRepository;
    private final CommitRepository commitRepository;
    private final GithubRepositoryService githubRepositoryService;
    private final GithubClient githubClient;
    private final CommitSyncService commitSyncService;
    private final UnusualActivityDetectionService unusualActivityDetectionService;
    private final AuditLogService auditLogService;

    public CheckpointService(SprintRepository sprintRepository,
                             TeamRepository teamRepository,
                             GitRepositoryRepository gitRepositoryRepository,
                             CheckpointRepository checkpointRepository,
                             CommitRepository commitRepository,
                             GithubRepositoryService githubRepositoryService,
                             GithubClient githubClient,
                             CommitSyncService commitSyncService,
                             UnusualActivityDetectionService unusualActivityDetectionService,
                             AuditLogService auditLogService) {
        this.sprintRepository = sprintRepository;
        this.teamRepository = teamRepository;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.checkpointRepository = checkpointRepository;
        this.commitRepository = commitRepository;
        this.githubRepositoryService = githubRepositoryService;
        this.githubClient = githubClient;
        this.commitSyncService = commitSyncService;
        this.unusualActivityDetectionService = unusualActivityDetectionService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public FreezeSprintResponse freezeSprint(Long sprintId, String note, String actor) {
        if (!StringUtils.hasText(note) || note.trim().length() < 3) {
            throw new IllegalArgumentException("Freeze note is required and must be at least 3 characters");
        }

        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", sprintId));

        if (sprint.getStatus() == Sprint.SprintStatus.FROZEN) {
            throw InvalidStateTransitionException.sprintAlreadyFrozen(sprint.getSprintNumber());
        }

        if (sprint.getStatus() != Sprint.SprintStatus.ACTIVE) {
            throw InvalidStateTransitionException.sprintNotActive(sprint.getSprintNumber());
        }

        log.info("Freezing Sprint {} ({}) by actor '{}': '{}'", sprint.getSprintNumber(), sprint.getName(), actor, note);

        List<Team> teams = teamRepository.findAll();
        List<FreezeResultItem> results = new ArrayList<>();
        List<String> failures = new ArrayList<>();

        for (Team team : teams) {
            if (team.getRepositoryId() == null) {
                log.info("Skipping Team {} - no repository assigned", team.getTeamNumber());
                continue;
            }

            GitRepository repo = gitRepositoryRepository.findById(team.getRepositoryId()).orElse(null);
            if (repo == null) {
                String error = String.format("Team %02d repository with ID %d not found in database", team.getTeamNumber(), team.getRepositoryId());
                failures.add(error);
                results.add(FreezeResultItem.builder()
                        .teamNumber(team.getTeamNumber())
                        .teamName(team.getTeamName())
                        .status("FAILED")
                        .errorMessage(error)
                        .build());
                continue;
            }

            try {
                FreezeResultItem item = freezeTeamRepository(sprint, team, repo, actor, note);
                results.add(item);
                if ("FAILED".equals(item.getStatus())) {
                    failures.add(String.format("Team %02d (%s): %s", team.getTeamNumber(), repo.getFullName(), item.getErrorMessage()));
                }
            } catch (Exception e) {
                log.error("Failed to freeze repository for Team {}", team.getTeamNumber(), e);
                String error = "Error freezing repo " + repo.getFullName() + ": " + e.getMessage();
                failures.add(error);
                results.add(FreezeResultItem.builder()
                        .teamNumber(team.getTeamNumber())
                        .teamName(team.getTeamName())
                        .repository(repo.getFullName())
                        .status("FAILED")
                        .errorMessage(error)
                        .build());
            }
        }

        // Determine overall status
        String overallStatus;
        if (failures.isEmpty()) {
            overallStatus = "SUCCESS";
            sprint.setStatus(Sprint.SprintStatus.FROZEN);
            sprint.setFreezeNote(note.trim());
            sprint.setFrozenAt(LocalDateTime.now());
            sprint.setFrozenBy(actor != null ? actor : "admin");
            sprintRepository.save(sprint);

            auditLogService.logAction(
                    AuditLog.AuditAction.SPRINT_FROZEN,
                    actor,
                    null,
                    null,
                    null,
                    sprint.getId(),
                    note.trim(),
                    String.format("{\"sprintNumber\":%d,\"status\":\"FROZEN\",\"teamsProcessed\":%d}", sprint.getSprintNumber(), results.size())
            );
        } else if (results.stream().anyMatch(r -> "FROZEN".equals(r.getStatus()))) {
            overallStatus = "PARTIAL_FAILURE";
            log.warn("Sprint {} freeze completed with partial failures: {} errors", sprint.getSprintNumber(), failures.size());
        } else {
            overallStatus = "FAILED";
            log.error("Sprint {} freeze failed for all repositories!", sprint.getSprintNumber());
        }

        return FreezeSprintResponse.builder()
                .sprint(sprint.getName())
                .sprintNumber(sprint.getSprintNumber())
                .status(overallStatus)
                .message("Sprint Frozen (Audit Checkpoint)")
                .results(results)
                .failures(failures)
                .build();
    }

    private FreezeResultItem freezeTeamRepository(Sprint sprint, Team team, GitRepository repo, String actor, String note) {
        log.info("Processing checkpoint for Team {} / Repo {}", team.getTeamNumber(), repo.getFullName());

        // 1. Sync latest commits first
        try {
            commitSyncService.syncRepository(repo.getId());
        } catch (Exception ex) {
            log.warn("Warning syncing commits for repo {}: {}", repo.getFullName(), ex.getMessage());
        }

        // 2. Fetch current HEAD SHA
        String headSha = githubRepositoryService.getHeadSha(repo).orElse(null);
        if (headSha == null) {
            // Check if there are existing commits in DB
            var commits = commitRepository.findByRepositoryIdOrderByCommittedAtDesc(repo.getId());
            if (!commits.isEmpty()) {
                headSha = commits.getFirst().getGithubCommitSha();
            } else {
                headSha = "EMPTY_REPO";
            }
        }

        // 3. Compute stats for this sprint
        LocalDateTime sprintStart = sprint.getReleasedAt();
        List<CommitEntity> sprintCommits = commitRepository.findByTeamIdSince(team.getId(), sprintStart);

        int commitCount = sprintCommits.size();
        Set<String> uniqueAuthors = new HashSet<>();
        int filesChanged = 0;
        int additions = 0;
        int deletions = 0;
        LocalDateTime firstActivity = null;
        LocalDateTime lastActivity = null;

        for (CommitEntity c : sprintCommits) {
            uniqueAuthors.add(c.getAuthorUsername());
            filesChanged += c.getChangedFiles();
            additions += c.getAdditions();
            deletions += c.getDeletions();

            if (firstActivity == null || c.getCommittedAt().isBefore(firstActivity)) {
                firstActivity = c.getCommittedAt();
            }
            if (lastActivity == null || c.getCommittedAt().isAfter(lastActivity)) {
                lastActivity = c.getCommittedAt();
            }
        }

        // 4. Save or retrieve existing Checkpoint (Idempotent: unique sprint_id + team_id)
        Optional<Checkpoint> existingCheckpoint = checkpointRepository.findBySprintIdAndTeamId(sprint.getId(), team.getId());
        Checkpoint checkpoint;

        if (existingCheckpoint.isPresent()) {
            checkpoint = existingCheckpoint.get();
            log.info("Checkpoint already exists for sprint {} and team {}. Retaining immutable SHA: {}",
                    sprint.getSprintNumber(), team.getTeamNumber(), checkpoint.getCommitSha());
        } else {
            checkpoint = Checkpoint.builder()
                    .sprint(sprint)
                    .team(team)
                    .repository(repo)
                    .commitSha(headSha)
                    .commitCount(commitCount)
                    .developerCount(uniqueAuthors.size())
                    .filesChanged(filesChanged)
                    .additions(additions)
                    .deletions(deletions)
                    .firstActivityAt(firstActivity)
                    .lastActivityAt(lastActivity)
                    .status("CREATED")
                    .build();

            checkpoint = checkpointRepository.save(checkpoint);

            auditLogService.logAction(
                    AuditLog.AuditAction.CHECKPOINT_CREATED,
                    actor,
                    null,
                    team.getId(),
                    repo.getId(),
                    sprint.getId(),
                    "Checkpoint created for Sprint " + sprint.getSprintNumber(),
                    String.format("{\"commitSha\":\"%s\",\"commits\":%d,\"additions\":%d,\"deletions\":%d}", headSha, commitCount, additions, deletions)
            );

            // Check NO_ACTIVITY rule
            unusualActivityDetectionService.checkNoActivity(sprint, team, repo, commitCount);

            final Checkpoint finalCheckpoint = checkpoint;
            // Check BULK_CHANGE rule if previous sprint exists
            if (sprint.getSprintNumber() > 1) {
                sprintRepository.findBySprintNumber(sprint.getSprintNumber() - 1).ifPresent(prevSprint -> {
                    checkpointRepository.findBySprintIdAndTeamId(prevSprint.getId(), team.getId()).ifPresent(prevCp -> {
                        unusualActivityDetectionService.checkBulkChange(finalCheckpoint, prevCp);
                    });
                });
            }
        }

        // 5. Checkpoint recorded without GitHub PATCH archiving (repository remains active)
        log.info("Checkpoint recorded for Team {} (Commit SHA: {}) - GitHub repository remains active",
                team.getTeamNumber(), checkpoint.getCommitSha());

        return FreezeResultItem.builder()
                .teamNumber(team.getTeamNumber())
                .teamName(team.getTeamName())
                .repository(repo.getFullName())
                .status("FROZEN")
                .message("Checkpoint Recorded")
                .checkpointSha(checkpoint.getCommitSha())
                .commitCount(checkpoint.getCommitCount())
                .filesChanged(checkpoint.getFilesChanged())
                .additions(checkpoint.getAdditions())
                .deletions(checkpoint.getDeletions())
                .build();
    }
}
