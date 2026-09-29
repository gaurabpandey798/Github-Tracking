package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.ReleaseSprintResponse;
import com.ideax.codemonitor.dto.SprintDetailResponse;
import com.ideax.codemonitor.dto.SprintSummaryResponse;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.exception.InvalidStateTransitionException;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SprintService {

    private static final Logger log = LoggerFactory.getLogger(SprintService.class);

    private final SprintRepository sprintRepository;
    private final EventStateRepository eventStateRepository;
    private final CheckpointRepository checkpointRepository;
    private final CommitRepository commitRepository;
    private final ReviewFlagRepository reviewFlagRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final GithubClient githubClient;
    private final AuditLogService auditLogService;

    public SprintService(SprintRepository sprintRepository,
                         EventStateRepository eventStateRepository,
                         CheckpointRepository checkpointRepository,
                         CommitRepository commitRepository,
                         ReviewFlagRepository reviewFlagRepository,
                         GitRepositoryRepository gitRepositoryRepository,
                         GithubClient githubClient,
                         AuditLogService auditLogService) {
        this.sprintRepository = sprintRepository;
        this.eventStateRepository = eventStateRepository;
        this.checkpointRepository = checkpointRepository;
        this.commitRepository = commitRepository;
        this.reviewFlagRepository = reviewFlagRepository;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.githubClient = githubClient;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<SprintSummaryResponse> listSprints() {
        List<Sprint> sprints = sprintRepository.findAllByOrderBySprintNumberAsc();
        List<SprintSummaryResponse> response = new ArrayList<>();

        for (Sprint s : sprints) {
            int cpCount = checkpointRepository.findBySprintId(s.getId()).size();
            response.add(SprintSummaryResponse.builder()
                    .id(s.getId())
                    .sprintNumber(s.getSprintNumber())
                    .name(s.getName())
                    .status(s.getStatus())
                    .releaseNote(s.getReleaseNote())
                    .freezeNote(s.getFreezeNote())
                    .releasedAt(s.getReleasedAt())
                    .releasedBy(s.getReleasedBy())
                    .frozenAt(s.getFrozenAt())
                    .frozenBy(s.getFrozenBy())
                    .checkpointsCount(cpCount)
                    .build());
        }
        return response;
    }

    @Transactional(readOnly = true)
    public SprintDetailResponse getSprintDetail(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", sprintId));

        List<Checkpoint> checkpoints = checkpointRepository.findBySprintId(sprint.getId());
        List<SprintDetailResponse.CheckpointSummaryDto> checkpointDtos = checkpoints.stream().map(cp ->
                SprintDetailResponse.CheckpointSummaryDto.builder()
                        .checkpointId(cp.getId())
                        .teamNumber(cp.getTeam().getTeamNumber())
                        .teamName(cp.getTeam().getTeamName())
                        .repositoryName(cp.getRepository().getFullName())
                        .commitSha(cp.getCommitSha())
                        .commitCount(cp.getCommitCount())
                        .developerCount(cp.getDeveloperCount())
                        .filesChanged(cp.getFilesChanged())
                        .additions(cp.getAdditions())
                        .deletions(cp.getDeletions())
                        .firstActivityAt(cp.getFirstActivityAt())
                        .lastActivityAt(cp.getLastActivityAt())
                        .createdAt(cp.getCreatedAt())
                        .build()
        ).toList();

        List<ReviewFlag> reviewFlags = reviewFlagRepository.findBySprintId(sprint.getId());
        List<SprintDetailResponse.ReviewFlagSummaryDto> flagDtos = reviewFlags.stream().map(rf ->
                SprintDetailResponse.ReviewFlagSummaryDto.builder()
                        .id(rf.getId())
                        .teamNumber(rf.getTeam().getTeamNumber())
                        .type(rf.getType())
                        .severity(rf.getSeverity())
                        .title(rf.getTitle())
                        .description(rf.getDescription())
                        .status(rf.getStatus())
                        .commitSha(rf.getCommitSha())
                        .createdAt(rf.getCreatedAt())
                        .build()
        ).toList();

        // Find commits committed during this sprint window
        List<CommitEntity> commits = new ArrayList<>();
        if (sprint.getReleasedAt() != null) {
            LocalDateTime end = sprint.getFrozenAt() != null ? sprint.getFrozenAt() : LocalDateTime.now();
            // Fetch top 50 recent commits
            commits = commitRepository.findAll().stream()
                    .filter(c -> c.getCommittedAt().isAfter(sprint.getReleasedAt()) && c.getCommittedAt().isBefore(end))
                    .limit(50)
                    .toList();
        }

        List<SprintDetailResponse.CommitSummaryDto> commitDtos = commits.stream().map(c ->
                SprintDetailResponse.CommitSummaryDto.builder()
                        .commitSha(c.getGithubCommitSha())
                        .authorUsername(c.getAuthorUsername())
                        .message(c.getMessage())
                        .committedAt(c.getCommittedAt())
                        .additions(c.getAdditions())
                        .deletions(c.getDeletions())
                        .changedFiles(c.getChangedFiles())
                        .teamNumber(c.getTeam().getTeamNumber())
                        .build()
        ).toList();

        return SprintDetailResponse.builder()
                .id(sprint.getId())
                .sprintNumber(sprint.getSprintNumber())
                .name(sprint.getName())
                .status(sprint.getStatus())
                .releaseNote(sprint.getReleaseNote())
                .freezeNote(sprint.getFreezeNote())
                .releasedAt(sprint.getReleasedAt())
                .releasedBy(sprint.getReleasedBy())
                .frozenAt(sprint.getFrozenAt())
                .frozenBy(sprint.getFrozenBy())
                .checkpoints(checkpointDtos)
                .recentCommits(commitDtos)
                .reviewFlags(flagDtos)
                .build();
    }

    @Transactional
    public ReleaseSprintResponse releaseSprint(Long sprintId, String note, String actor) {
        if (!StringUtils.hasText(note) || note.trim().length() < 3) {
            throw new IllegalArgumentException("Release note is required and must have at least 3 characters");
        }

        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", sprintId));

        if (sprint.getStatus() == Sprint.SprintStatus.ACTIVE) {
            throw new InvalidStateTransitionException("SPRINT_ALREADY_ACTIVE", "Sprint " + sprint.getSprintNumber() + " is already active.");
        }

        if (sprint.getStatus() == Sprint.SprintStatus.FROZEN || sprint.getStatus() == Sprint.SprintStatus.COMPLETED) {
            throw new InvalidStateTransitionException("SPRINT_ALREADY_CLOSED", "Sprint " + sprint.getSprintNumber() + " has already been frozen/completed.");
        }

        // Verify previous sprint was FROZEN
        if (sprint.getSprintNumber() > 1) {
            Sprint previousSprint = sprintRepository.findBySprintNumber(sprint.getSprintNumber() - 1)
                    .orElseThrow(() -> new IllegalStateException("Previous sprint " + (sprint.getSprintNumber() - 1) + " not found"));

            if (previousSprint.getStatus() != Sprint.SprintStatus.FROZEN) {
                throw InvalidStateTransitionException.previousSprintNotFrozen(sprint.getSprintNumber());
            }
        }

        LocalDateTime now = LocalDateTime.now();
        sprint.setStatus(Sprint.SprintStatus.ACTIVE);
        sprint.setReleaseNote(note.trim());
        sprint.setReleasedAt(now);
        sprint.setReleasedBy(actor != null ? actor : "admin");
        sprintRepository.save(sprint);

        // Update event state
        eventStateRepository.getGlobalEventState().ifPresent(event -> {
            event.setCurrentSprintNumber(sprint.getSprintNumber());
            eventStateRepository.save(event);
        });

        // Do not unarchive repositories on GitHub (repositories remain active throughout)
        List<String> unarchived = new ArrayList<>();
        List<String> failures = new ArrayList<>();

        auditLogService.logAction(
                AuditLog.AuditAction.SPRINT_RELEASED,
                actor,
                null,
                null,
                null,
                sprint.getId(),
                note.trim(),
                String.format("{\"sprint\":%d,\"name\":\"%s\",\"status\":\"ACTIVE\"}", sprint.getSprintNumber(), sprint.getName())
        );

        return ReleaseSprintResponse.builder()
                .sprintNumber(sprint.getSprintNumber())
                .sprintName(sprint.getName())
                .status("ACTIVE")
                .releaseNote(note.trim())
                .releasedAt(now)
                .unarchivedRepositories(unarchived)
                .failures(failures)
                .build();
    }
}
