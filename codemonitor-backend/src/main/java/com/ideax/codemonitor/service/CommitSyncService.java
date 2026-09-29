package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.RepositorySyncResponse;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.github.GithubCommitService;
import com.ideax.codemonitor.github.GithubRepositoryService;
import com.ideax.codemonitor.github.dto.GithubCommitDto;
import com.ideax.codemonitor.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CommitSyncService {

    private static final Logger log = LoggerFactory.getLogger(CommitSyncService.class);

    private final GitRepositoryRepository gitRepositoryRepository;
    private final TeamRepository teamRepository;
    private final CommitRepository commitRepository;
    private final CheckpointRepository checkpointRepository;
    private final ParticipantRepository participantRepository;
    private final SprintRepository sprintRepository;
    private final GithubCommitService githubCommitService;
    private final GithubRepositoryService githubRepositoryService;
    private final UnusualActivityDetectionService unusualActivityDetectionService;
    private final AuditLogService auditLogService;

    public CommitSyncService(GitRepositoryRepository gitRepositoryRepository,
                             TeamRepository teamRepository,
                             CommitRepository commitRepository,
                             CheckpointRepository checkpointRepository,
                             ParticipantRepository participantRepository,
                             SprintRepository sprintRepository,
                             GithubCommitService githubCommitService,
                             GithubRepositoryService githubRepositoryService,
                             UnusualActivityDetectionService unusualActivityDetectionService,
                             AuditLogService auditLogService) {
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.teamRepository = teamRepository;
        this.commitRepository = commitRepository;
        this.checkpointRepository = checkpointRepository;
        this.participantRepository = participantRepository;
        this.sprintRepository = sprintRepository;
        this.githubCommitService = githubCommitService;
        this.githubRepositoryService = githubRepositoryService;
        this.unusualActivityDetectionService = unusualActivityDetectionService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public RepositorySyncResponse syncRepository(Long repositoryId) {
        GitRepository repository = gitRepositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Repository", repositoryId));

        Team team = repository.getTeam();
        if (team == null) {
            team = teamRepository.findByRepositoryId(repositoryId)
                    .orElseThrow(() -> new IllegalStateException("Repository is not assigned to any Team"));
        }

        Sprint activeSprint = sprintRepository.findByStatus(Sprint.SprintStatus.ACTIVE).orElse(null);

        log.info("Starting commit synchronization for repository {} (Team {})", repository.getFullName(), team.getTeamNumber());

        String defaultBranch = repository.getDefaultBranch() != null ? repository.getDefaultBranch() : "main";
        List<GithubCommitDto> ghCommits = githubCommitService.fetchCommits(
                repository.getOwner(),
                repository.getName(),
                defaultBranch,
                null
        );

        int newCommitsCount = 0;
        int flaggedIssuesCount = 0;
        Set<String> detectedContributors = new HashSet<>();
        List<String> flagsCreated = new ArrayList<>();

        String latestHeadSha = null;

        for (GithubCommitDto ghCommit : ghCommits) {
            if (latestHeadSha == null) {
                latestHeadSha = ghCommit.getSha();
            }

            Optional<CommitEntity> existing = commitRepository.findByRepositoryIdAndGithubCommitSha(
                    repository.getId(), ghCommit.getSha()
            );

            if (existing.isPresent()) {
                detectedContributors.add(existing.get().getAuthorUsername());
                continue;
            }

            // Fetch detail for file change & additions stats if not present in list item
            int additions = 0;
            int deletions = 0;
            int changedFiles = 0;

            if (ghCommit.getStats() != null) {
                additions = ghCommit.getStats().getAdditions();
                deletions = ghCommit.getStats().getDeletions();
                changedFiles = ghCommit.getFiles() != null ? ghCommit.getFiles().size() : ghCommit.getStats().getTotal();
            } else {
                Optional<GithubCommitDto> detailOpt = githubCommitService.fetchCommitDetail(
                        repository.getOwner(), repository.getName(), ghCommit.getSha()
                );
                if (detailOpt.isPresent()) {
                    GithubCommitDto detail = detailOpt.get();
                    if (detail.getStats() != null) {
                        additions = detail.getStats().getAdditions();
                        deletions = detail.getStats().getDeletions();
                    }
                    if (detail.getFiles() != null) {
                        changedFiles = detail.getFiles().size();
                    }
                }
            }

            String authorUsername = "unknown";
            Long authorUserId = null;
            if (ghCommit.getAuthor() != null) {
                authorUsername = ghCommit.getAuthor().getLogin();
                authorUserId = ghCommit.getAuthor().getId();
            } else if (ghCommit.getCommit() != null && ghCommit.getCommit().getAuthor() != null) {
                authorUsername = ghCommit.getCommit().getAuthor().getName();
            }

            detectedContributors.add(authorUsername);

            LocalDateTime committedAt = parseIsoDate(
                    ghCommit.getCommit() != null && ghCommit.getCommit().getAuthor() != null
                            ? ghCommit.getCommit().getAuthor().getDate()
                            : null
            );

            Participant participant = participantRepository.findByTeamIdAndGithubUsernameIgnoreCase(
                    team.getId(), authorUsername
            ).orElse(null);

            CommitEntity commitEntity = CommitEntity.builder()
                    .githubCommitSha(ghCommit.getSha())
                    .repository(repository)
                    .team(team)
                    .participant(participant)
                    .authorGithubUserId(authorUserId)
                    .authorUsername(authorUsername)
                    .message(ghCommit.getCommit() != null ? ghCommit.getCommit().getMessage() : "")
                    .branch(defaultBranch)
                    .committedAt(committedAt)
                    .additions(additions)
                    .deletions(deletions)
                    .changedFiles(changedFiles)
                    .commitUrl(ghCommit.getHtmlUrl())
                    .build();

            CommitEntity savedCommit = commitRepository.save(commitEntity);
            newCommitsCount++;

            // Run detection rules
            var largeCommitFlag = unusualActivityDetectionService.checkLargeCommit(savedCommit, activeSprint);
            if (largeCommitFlag.isPresent()) {
                flaggedIssuesCount++;
                flagsCreated.add("LARGE_COMMIT: " + savedCommit.getGithubCommitSha().substring(0, 7));
            }

            var unknownFlag = unusualActivityDetectionService.checkUnknownContributor(
                    team, repository, activeSprint, savedCommit.getGithubCommitSha(), authorUserId, authorUsername
            );
            if (unknownFlag.isPresent()) {
                flaggedIssuesCount++;
                flagsCreated.add("UNKNOWN_CONTRIBUTOR: " + authorUsername);
            }

            // Track commits occurring after checkpoint SHA as post-checkpoint activity
            Optional<Checkpoint> latestCpOpt = checkpointRepository.findTopByTeamIdOrderByCreatedAtDesc(team.getId());
            if (latestCpOpt.isPresent()) {
                Checkpoint cp = latestCpOpt.get();
                boolean isPostCheckpoint = false;
                if (cp.getSprint().getStatus() == Sprint.SprintStatus.FROZEN
                        && !savedCommit.getGithubCommitSha().equals(cp.getCommitSha())) {
                    isPostCheckpoint = true;
                } else if (activeSprint != null && cp.getSprint().getFrozenAt() != null
                        && savedCommit.getCommittedAt() != null
                        && savedCommit.getCommittedAt().isAfter(cp.getSprint().getFrozenAt())
                        && savedCommit.getCommittedAt().isBefore(activeSprint.getReleasedAt())) {
                    isPostCheckpoint = true;
                }

                if (isPostCheckpoint) {
                    var postFlag = unusualActivityDetectionService.checkPostCheckpointActivity(
                            team, repository, cp.getSprint(), cp, savedCommit
                    );
                    if (postFlag.isPresent()) {
                        flaggedIssuesCount++;
                        flagsCreated.add("POST_CHECKPOINT_ACTIVITY: " + savedCommit.getGithubCommitSha().substring(0, Math.min(7, savedCommit.getGithubCommitSha().length())));
                    }

                    auditLogService.logAction(
                            AuditLog.AuditAction.COMMIT_RECEIVED,
                            authorUsername,
                            null,
                            team.getId(),
                            repository.getId(),
                            cp.getSprint().getId(),
                            String.format("Post-checkpoint activity: commit %s submitted after Sprint %d checkpoint (%s)",
                                    savedCommit.getGithubCommitSha(), cp.getSprint().getSprintNumber(), cp.getCommitSha()),
                            String.format("{\"postCheckpoint\":true,\"checkpointSha\":\"%s\",\"commitSha\":\"%s\",\"sprintNumber\":%d}",
                                    cp.getCommitSha(), savedCommit.getGithubCommitSha(), cp.getSprint().getSprintNumber())
                    );
                }
            }
        }

        if (newCommitsCount > 0) {
            var suddenFlag = unusualActivityDetectionService.checkSuddenActivity(team, repository, activeSprint);
            if (suddenFlag.isPresent()) {
                flaggedIssuesCount++;
                flagsCreated.add("SUDDEN_ACTIVITY");
            }

            auditLogService.logAction(
                    AuditLog.AuditAction.COMMIT_RECEIVED,
                    "sync",
                    null,
                    team.getId(),
                    repository.getId(),
                    activeSprint != null ? activeSprint.getId() : null,
                    String.format("Synchronized %d new commits for repo %s", newCommitsCount, repository.getFullName()),
                    String.format("{\"newCommits\":%d,\"headSha\":\"%s\"}", newCommitsCount, latestHeadSha)
            );
        }

        long totalCommits = commitRepository.countByTeamId(team.getId());

        return RepositorySyncResponse.builder()
                .repositoryId(repository.getId())
                .fullName(repository.getFullName())
                .defaultBranch(defaultBranch)
                .headSha(latestHeadSha)
                .newCommitsCount(newCommitsCount)
                .totalCommitsCount((int) totalCommits)
                .flaggedIssuesCount(flaggedIssuesCount)
                .detectedContributors(new ArrayList<>(detectedContributors))
                .flagsCreated(flagsCreated)
                .build();
    }

    private LocalDateTime parseIsoDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return OffsetDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME)
                    .atZoneSameInstant(java.time.ZoneId.systemDefault())
                    .toLocalDateTime();
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}
