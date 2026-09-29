package com.ideax.codemonitor.service;

import com.ideax.codemonitor.config.MonitoringProperties;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.repository.CommitRepository;
import com.ideax.codemonitor.repository.ParticipantRepository;
import com.ideax.codemonitor.repository.ReviewFlagRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UnusualActivityDetectionService {

    private static final Logger log = LoggerFactory.getLogger(UnusualActivityDetectionService.class);

    private final ReviewFlagRepository reviewFlagRepository;
    private final ParticipantRepository participantRepository;
    private final CommitRepository commitRepository;
    private final MonitoringProperties monitoringProperties;
    private final AuditLogService auditLogService;

    public UnusualActivityDetectionService(ReviewFlagRepository reviewFlagRepository,
                                           ParticipantRepository participantRepository,
                                           CommitRepository commitRepository,
                                           MonitoringProperties monitoringProperties,
                                           AuditLogService auditLogService) {
        this.reviewFlagRepository = reviewFlagRepository;
        this.participantRepository = participantRepository;
        this.commitRepository = commitRepository;
        this.monitoringProperties = monitoringProperties;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Optional<ReviewFlag> checkLargeCommit(CommitEntity commit, Sprint sprint) {
        int filesThreshold = monitoringProperties.getLargeCommit().getFilesThreshold();
        int linesThreshold = monitoringProperties.getLargeCommit().getLinesThreshold();

        boolean excessiveFiles = commit.getChangedFiles() >= filesThreshold;
        boolean excessiveLines = (commit.getAdditions() + commit.getDeletions()) >= linesThreshold;

        if (excessiveFiles || excessiveLines) {
            String title = "Review Recommended: Large Commit Detected";
            String description = String.format("Commit %s by '%s' modified %d files (+%d, -%d lines), exceeding monitoring thresholds (files: %d, lines: %d).",
                    commit.getGithubCommitSha().substring(0, Math.min(7, commit.getGithubCommitSha().length())),
                    commit.getAuthorUsername(),
                    commit.getChangedFiles(),
                    commit.getAdditions(),
                    commit.getDeletions(),
                    filesThreshold,
                    linesThreshold);

            return createFlagIfNotExist(
                    commit.getTeam(),
                    commit.getRepository(),
                    sprint,
                    ReviewFlag.ReviewFlagType.LARGE_COMMIT,
                    ReviewFlag.ReviewFlagSeverity.MEDIUM,
                    title,
                    description,
                    commit.getGithubCommitSha(),
                    String.format("{\"files\":%d,\"additions\":%d,\"deletions\":%d}", commit.getChangedFiles(), commit.getAdditions(), commit.getDeletions())
            );
        }
        return Optional.empty();
    }

    @Transactional
    public Optional<ReviewFlag> checkUnknownContributor(Team team, GitRepository repository, Sprint sprint,
                                                        String commitSha, Long githubUserId, String username) {
        // If team has participants enrolled, check if author is known
        var participants = participantRepository.findByTeamId(team.getId());
        if (participants.isEmpty()) {
            return Optional.empty();
        }

        boolean known = participants.stream().anyMatch(p ->
                (githubUserId != null && githubUserId.equals(p.getGithubUserId())) ||
                p.getGithubUsername().equalsIgnoreCase(username));

        if (!known) {
            String title = "Review Recommended: Unknown Contributor";
            String description = String.format("Commit %s was authored by '%s' (github_user_id=%s) who is not registered in Team %02d.",
                    commitSha != null ? commitSha.substring(0, Math.min(7, commitSha.length())) : "N/A",
                    username,
                    githubUserId != null ? githubUserId : "unknown",
                    team.getTeamNumber());

            return createFlagIfNotExist(
                    team,
                    repository,
                    sprint,
                    ReviewFlag.ReviewFlagType.UNKNOWN_CONTRIBUTOR,
                    ReviewFlag.ReviewFlagSeverity.HIGH,
                    title,
                    description,
                    commitSha,
                    String.format("{\"username\":\"%s\",\"githubUserId\":%s}", username, githubUserId)
            );
        }
        return Optional.empty();
    }

    @Transactional
    public Optional<ReviewFlag> checkSuddenActivity(Team team, GitRepository repository, Sprint sprint) {
        int windowMinutes = monitoringProperties.getSuddenActivity().getWindowMinutes();
        int commitsThreshold = monitoringProperties.getSuddenActivity().getCommitsThreshold();

        LocalDateTime since = LocalDateTime.now().minusMinutes(windowMinutes);
        long recentCount = commitRepository.countRecentCommits(team.getId(), since);

        if (recentCount >= commitsThreshold) {
            String title = "Review Recommended: Sudden Activity Burst";
            String description = String.format("Team %02d submitted %d commits within the last %d minutes, exceeding the sudden activity threshold (%d commits).",
                    team.getTeamNumber(), recentCount, windowMinutes, commitsThreshold);

            return createFlagIfNotExist(
                    team,
                    repository,
                    sprint,
                    ReviewFlag.ReviewFlagType.SUDDEN_ACTIVITY,
                    ReviewFlag.ReviewFlagSeverity.MEDIUM,
                    title,
                    description,
                    null,
                    String.format("{\"windowMinutes\":%d,\"commitCount\":%d}", windowMinutes, recentCount)
            );
        }
        return Optional.empty();
    }

    @Transactional
    public Optional<ReviewFlag> checkForcePush(Team team, GitRepository repository, Sprint sprint,
                                              String commitSha, String ref, String pusher) {
        String title = "Review Recommended: Force Push / History Change";
        String description = String.format("A forced push or history rewrite was detected on branch '%s' by '%s'.", ref, pusher);

        return createFlagIfNotExist(
                team,
                repository,
                sprint,
                ReviewFlag.ReviewFlagType.FORCE_PUSH,
                ReviewFlag.ReviewFlagSeverity.HIGH,
                title,
                description,
                commitSha,
                String.format("{\"ref\":\"%s\",\"pusher\":\"%s\",\"forced\":true}", ref, pusher)
        );
    }

    @Transactional
    public Optional<ReviewFlag> checkBulkChange(Checkpoint currentCheckpoint, Checkpoint previousCheckpoint) {
        if (previousCheckpoint == null || previousCheckpoint.getFilesChanged() == 0) {
            return Optional.empty();
        }

        double factor = monitoringProperties.getBulkChange().getFilesFactor();
        if (currentCheckpoint.getFilesChanged() >= (previousCheckpoint.getFilesChanged() * factor)
                && currentCheckpoint.getFilesChanged() > 50) {
            String title = "Review Recommended: Bulk File Changes";
            String description = String.format("Sprint %d checkpoint recorded %d files changed, which is %.1fx higher than Sprint %d (%d files).",
                    currentCheckpoint.getSprint().getSprintNumber(),
                    currentCheckpoint.getFilesChanged(),
                    (double) currentCheckpoint.getFilesChanged() / previousCheckpoint.getFilesChanged(),
                    previousCheckpoint.getSprint().getSprintNumber(),
                    previousCheckpoint.getFilesChanged());

            return createFlagIfNotExist(
                    currentCheckpoint.getTeam(),
                    currentCheckpoint.getRepository(),
                    currentCheckpoint.getSprint(),
                    ReviewFlag.ReviewFlagType.BULK_CHANGE,
                    ReviewFlag.ReviewFlagSeverity.LOW,
                    title,
                    description,
                    currentCheckpoint.getCommitSha(),
                    String.format("{\"previousFiles\":%d,\"currentFiles\":%d}", previousCheckpoint.getFilesChanged(), currentCheckpoint.getFilesChanged())
            );
        }
        return Optional.empty();
    }

    @Transactional
    public Optional<ReviewFlag> checkNoActivity(Sprint sprint, Team team, GitRepository repository, int sprintCommitCount) {
        if (sprintCommitCount == 0) {
            String title = "Review Recommended: No Activity Recorded";
            String description = String.format("Team %02d had no commit activity recorded during Sprint %d (%s).",
                    team.getTeamNumber(), sprint.getSprintNumber(), sprint.getName());

            // Check if already flagged for this sprint + team
            if (reviewFlagRepository.existsByTeamIdAndSprintIdAndType(team.getId(), sprint.getId(), ReviewFlag.ReviewFlagType.NO_ACTIVITY)) {
                return Optional.empty();
            }

            return createFlagIfNotExist(
                    team,
                    repository,
                    sprint,
                    ReviewFlag.ReviewFlagType.NO_ACTIVITY,
                    ReviewFlag.ReviewFlagSeverity.LOW,
                    title,
                    description,
                    null,
                    "{\"commitCount\":0}"
            );
        }
        return Optional.empty();
    }

    @Transactional
    public Optional<ReviewFlag> checkPostCheckpointActivity(Team team, GitRepository repository, Sprint sprint,
                                                            Checkpoint checkpoint, CommitEntity commit) {
        String shortCommitSha = commit.getGithubCommitSha() != null
                ? commit.getGithubCommitSha().substring(0, Math.min(7, commit.getGithubCommitSha().length()))
                : "unknown";
        String shortCpSha = checkpoint.getCommitSha() != null
                ? checkpoint.getCommitSha().substring(0, Math.min(7, checkpoint.getCommitSha().length()))
                : "unknown";

        String title = "Review Recommended: Post-Checkpoint Activity";
        String description = String.format("Commit %s was submitted after Sprint %d checkpoint (%s) while sprint was frozen.",
                shortCommitSha,
                sprint != null ? sprint.getSprintNumber() : 0,
                shortCpSha);

        return createFlagIfNotExist(
                team,
                repository,
                sprint,
                ReviewFlag.ReviewFlagType.POST_CHECKPOINT_ACTIVITY,
                ReviewFlag.ReviewFlagSeverity.MEDIUM,
                title,
                description,
                commit.getGithubCommitSha(),
                String.format("{\"checkpointSha\":\"%s\",\"commitSha\":\"%s\",\"sprintNumber\":%d,\"postCheckpoint\":true}",
                        checkpoint.getCommitSha(), commit.getGithubCommitSha(), sprint != null ? sprint.getSprintNumber() : 0)
        );
    }

    private Optional<ReviewFlag> createFlagIfNotExist(Team team, GitRepository repo, Sprint sprint,
                                                      ReviewFlag.ReviewFlagType type,
                                                      ReviewFlag.ReviewFlagSeverity severity,
                                                      String title, String description,
                                                      String commitSha, String evidenceJson) {
        if (commitSha != null && repo != null) {
            if (reviewFlagRepository.existsByRepositoryIdAndCommitShaAndType(repo.getId(), commitSha, type)) {
                return Optional.empty();
            }
        }

        ReviewFlag flag = ReviewFlag.builder()
                .team(team)
                .repository(repo)
                .sprint(sprint)
                .type(type)
                .severity(severity)
                .title(title)
                .description(description)
                .commitSha(commitSha)
                .evidenceJson(evidenceJson)
                .status(ReviewFlag.ReviewFlagStatus.OPEN)
                .build();

        ReviewFlag saved = reviewFlagRepository.save(flag);
        log.warn("CREATED REVIEW FLAG: [{}] - {} for Team {}", type, title, team.getTeamNumber());

        auditLogService.logAction(
                AuditLog.AuditAction.REVIEW_FLAG_CREATED,
                "system",
                null,
                team.getId(),
                repo != null ? repo.getId() : null,
                sprint != null ? sprint.getId() : null,
                title,
                evidenceJson
        );

        return Optional.of(saved);
    }
}
