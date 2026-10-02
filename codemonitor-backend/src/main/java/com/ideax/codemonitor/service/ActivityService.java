package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.ActivityItemDto;
import com.ideax.codemonitor.dto.AuditLogResponse;
import com.ideax.codemonitor.dto.PagedResponse;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final CommitRepository commitRepository;
    private final AuditLogRepository auditLogRepository;
    private final ReviewFlagRepository reviewFlagRepository;
    private final TeamRepository teamRepository;
    private final GitRepositoryRepository gitRepositoryRepository;

    public ActivityService(CommitRepository commitRepository,
                           AuditLogRepository auditLogRepository,
                           ReviewFlagRepository reviewFlagRepository,
                           TeamRepository teamRepository,
                           GitRepositoryRepository gitRepositoryRepository) {
        this.commitRepository = commitRepository;
        this.auditLogRepository = auditLogRepository;
        this.reviewFlagRepository = reviewFlagRepository;
        this.teamRepository = teamRepository;
        this.gitRepositoryRepository = gitRepositoryRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ActivityItemDto> getActivityFeed(Long teamId,
                                                         String type,
                                                         String severity,
                                                         LocalDateTime from,
                                                         LocalDateTime to,
                                                         String search,
                                                         int page,
                                                         int size) {
        if (size <= 0) size = 50;
        if (page < 0) page = 0;

        // Efficient lookup caches to avoid N+1 queries
        Map<Long, Team> teamMap = teamRepository.findAll().stream()
                .collect(Collectors.toMap(Team::getId, Function.identity(), (a, b) -> a));
        Map<Long, GitRepository> repoMap = gitRepositoryRepository.findAll().stream()
                .collect(Collectors.toMap(GitRepository::getId, Function.identity(), (a, b) -> a));

        List<ActivityItemDto> allItems = new ArrayList<>();

        // 1. Process Git Commits
        List<CommitEntity> commits = commitRepository.findAll();
        for (CommitEntity c : commits) {
            Team t = c.getTeam() != null ? teamMap.get(c.getTeam().getId()) : null;
            GitRepository r = c.getRepository() != null ? repoMap.get(c.getRepository().getId()) : null;

            Map<String, Object> meta = new HashMap<>();
            meta.put("commitSha", c.getGithubCommitSha());
            meta.put("additions", c.getAdditions());
            meta.put("deletions", c.getDeletions());
            meta.put("changedFiles", c.getChangedFiles());
            meta.put("branch", c.getBranch());
            meta.put("commitUrl", c.getCommitUrl());

            allItems.add(ActivityItemDto.builder()
                    .id("commit-" + c.getId())
                    .type("COMMIT")
                    .action("COMMIT_PUSHED")
                    .title("Commit pushed by @" + c.getAuthorUsername())
                    .description(c.getMessage() != null && !c.getMessage().isBlank() ? c.getMessage().trim() : "No commit message")
                    .timestamp(c.getCommittedAt() != null ? c.getCommittedAt() : c.getCreatedAt())
                    .severity("INFO")
                    .teamId(t != null ? t.getId() : (c.getTeam() != null ? c.getTeam().getId() : null))
                    .teamNumber(t != null ? t.getTeamNumber() : null)
                    .teamName(t != null ? t.getTeamName() : null)
                    .repositoryId(r != null ? r.getId() : (c.getRepository() != null ? c.getRepository().getId() : null))
                    .repositoryName(r != null ? r.getName() : null)
                    .actor(c.getAuthorUsername())
                    .githubUsername(c.getAuthorUsername())
                    .status("RECORDED")
                    .requiresReview(false)
                    .metadata(meta)
                    .build());
        }

        // 2. Process Review Flags
        List<ReviewFlag> reviewFlags = reviewFlagRepository.findAll();
        for (ReviewFlag rf : reviewFlags) {
            Team t = rf.getTeam() != null ? teamMap.get(rf.getTeam().getId()) : null;
            GitRepository r = rf.getRepository() != null ? repoMap.get(rf.getRepository().getId()) : null;

            Map<String, Object> meta = new HashMap<>();
            meta.put("flagId", rf.getId());
            meta.put("commitSha", rf.getCommitSha());
            meta.put("evidenceJson", rf.getEvidenceJson());
            meta.put("reviewedBy", rf.getReviewedBy());
            meta.put("reviewedAt", rf.getReviewedAt());
            meta.put("reviewNote", rf.getReviewNote());

            String flagSeverity = rf.getSeverity() != null ? rf.getSeverity().name() : "MEDIUM";
            boolean isPending = rf.getStatus() == ReviewFlag.ReviewFlagStatus.OPEN;

            allItems.add(ActivityItemDto.builder()
                    .id("review-" + rf.getId())
                    .type("REVIEW")
                    .action(rf.getType() != null ? rf.getType().name() : "UNUSUAL_ACTIVITY")
                    .title(rf.getTitle() != null ? rf.getTitle() : "Review Flag Detected")
                    .description(rf.getDescription() != null ? rf.getDescription() : "")
                    .timestamp(rf.getCreatedAt())
                    .severity(flagSeverity)
                    .teamId(t != null ? t.getId() : (rf.getTeam() != null ? rf.getTeam().getId() : null))
                    .teamNumber(t != null ? t.getTeamNumber() : null)
                    .teamName(t != null ? t.getTeamName() : null)
                    .repositoryId(r != null ? r.getId() : (rf.getRepository() != null ? rf.getRepository().getId() : null))
                    .repositoryName(r != null ? r.getName() : null)
                    .actor(rf.getReviewedBy() != null ? rf.getReviewedBy() : "system")
                    .githubUsername(null)
                    .status(rf.getStatus() != null ? rf.getStatus().name() : "OPEN")
                    .requiresReview(isPending)
                    .metadata(meta)
                    .build());
        }

        // 3. Process Audit Logs
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        for (AuditLog a : auditLogs) {
            Team t = a.getTeamId() != null ? teamMap.get(a.getTeamId()) : null;
            GitRepository r = a.getRepositoryId() != null ? repoMap.get(a.getRepositoryId()) : null;

            String category = mapAuditActionToCategory(a.getAction());
            String title = mapAuditActionToTitle(a.getAction(), t);

            Map<String, Object> meta = new HashMap<>();
            meta.put("auditId", a.getId());
            meta.put("sprintId", a.getSprintId());
            meta.put("metadataJson", a.getMetadataJson());

            allItems.add(ActivityItemDto.builder()
                    .id("audit-" + a.getId())
                    .type(category)
                    .action(a.getAction() != null ? a.getAction().name() : "AUDIT_ACTION")
                    .title(title)
                    .description(a.getNote() != null ? a.getNote() : "")
                    .timestamp(a.getCreatedAt())
                    .severity("INFO")
                    .teamId(t != null ? t.getId() : a.getTeamId())
                    .teamNumber(t != null ? t.getTeamNumber() : null)
                    .teamName(t != null ? t.getTeamName() : null)
                    .repositoryId(r != null ? r.getId() : a.getRepositoryId())
                    .repositoryName(r != null ? r.getName() : null)
                    .actor(a.getActor() != null ? a.getActor() : "admin")
                    .githubUsername(null)
                    .status("COMPLETED")
                    .requiresReview(false)
                    .metadata(meta)
                    .build());
        }

        // Apply Filtering
        List<ActivityItemDto> filtered = allItems.stream()
                .filter(item -> {
                    // Team filter
                    if (teamId != null && (item.getTeamId() == null || !item.getTeamId().equals(teamId))) {
                        return false;
                    }
                    // Type filter
                    if (StringUtils.hasText(type) && !type.equalsIgnoreCase("ALL")) {
                        if (!item.getType().equalsIgnoreCase(type)) {
                            return false;
                        }
                    }
                    // Severity filter
                    if (StringUtils.hasText(severity) && !severity.equalsIgnoreCase("ALL")) {
                        if (!item.getSeverity().equalsIgnoreCase(severity)) {
                            return false;
                        }
                    }
                    // Time range filters
                    if (from != null && item.getTimestamp() != null && item.getTimestamp().isBefore(from)) {
                        return false;
                    }
                    if (to != null && item.getTimestamp() != null && item.getTimestamp().isAfter(to)) {
                        return false;
                    }
                    // Text search filter
                    if (StringUtils.hasText(search)) {
                        String s = search.toLowerCase().trim();
                        boolean matchTitle = item.getTitle() != null && item.getTitle().toLowerCase().contains(s);
                        boolean matchDesc = item.getDescription() != null && item.getDescription().toLowerCase().contains(s);
                        boolean matchActor = item.getActor() != null && item.getActor().toLowerCase().contains(s);
                        boolean matchGh = item.getGithubUsername() != null && item.getGithubUsername().toLowerCase().contains(s);
                        boolean matchTeam = item.getTeamName() != null && item.getTeamName().toLowerCase().contains(s);
                        boolean matchRepo = item.getRepositoryName() != null && item.getRepositoryName().toLowerCase().contains(s);
                        if (!matchTitle && !matchDesc && !matchActor && !matchGh && !matchTeam && !matchRepo) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    if (a.getTimestamp() == null && b.getTimestamp() == null) return 0;
                    if (a.getTimestamp() == null) return 1;
                    if (b.getTimestamp() == null) return -1;
                    return b.getTimestamp().compareTo(a.getTimestamp());
                })
                .collect(Collectors.toList());

        long totalElements = filtered.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int start = page * size;
        int end = Math.min(start + size, filtered.size());

        List<ActivityItemDto> pagedItems = (start < filtered.size())
                ? filtered.subList(start, end)
                : Collections.emptyList();

        return PagedResponse.<ActivityItemDto>builder()
                .items(pagedItems)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(page + 1 < totalPages)
                .build();
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> getAuditLogs(Long teamId, String action, int page, int size) {
        if (size <= 0) size = 50;
        if (page < 0) page = 0;

        Map<Long, Team> teamMap = teamRepository.findAll().stream()
                .collect(Collectors.toMap(Team::getId, Function.identity(), (a, b) -> a));
        Map<Long, GitRepository> repoMap = gitRepositoryRepository.findAll().stream()
                .collect(Collectors.toMap(GitRepository::getId, Function.identity(), (a, b) -> a));

        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByCreatedAtDesc();

        List<AuditLogResponse> filtered = allLogs.stream()
                .filter(a -> {
                    if (teamId != null && (a.getTeamId() == null || !a.getTeamId().equals(teamId))) {
                        return false;
                    }
                    if (StringUtils.hasText(action) && !action.equalsIgnoreCase("ALL")) {
                        if (a.getAction() == null || !a.getAction().name().equalsIgnoreCase(action)) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(a -> {
                    Team t = a.getTeamId() != null ? teamMap.get(a.getTeamId()) : null;
                    GitRepository r = a.getRepositoryId() != null ? repoMap.get(a.getRepositoryId()) : null;

                    return AuditLogResponse.builder()
                            .id(a.getId())
                            .action(a.getAction())
                            .actor(a.getActor())
                            .actorId(a.getActorId())
                            .teamId(a.getTeamId())
                            .teamNumber(t != null ? t.getTeamNumber() : null)
                            .teamName(t != null ? t.getTeamName() : null)
                            .repositoryId(a.getRepositoryId())
                            .repositoryName(r != null ? r.getName() : null)
                            .sprintId(a.getSprintId())
                            .note(a.getNote())
                            .metadataJson(a.getMetadataJson())
                            .createdAt(a.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        long totalElements = filtered.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int start = page * size;
        int end = Math.min(start + size, filtered.size());

        List<AuditLogResponse> pagedItems = (start < filtered.size())
                ? filtered.subList(start, end)
                : Collections.emptyList();

        return PagedResponse.<AuditLogResponse>builder()
                .items(pagedItems)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(page + 1 < totalPages)
                .build();
    }

    private String mapAuditActionToCategory(AuditLog.AuditAction action) {
        if (action == null) return "AUDIT";
        return switch (action) {
            case EVENT_RELEASED -> "EVENT";
            case SPRINT_RELEASED, SPRINT_FROZEN -> "SPRINT";
            case CHECKPOINT_CREATED -> "CHECKPOINT";
            case REPOSITORY_ARCHIVED, REPOSITORY_UNARCHIVED, REPOSITORY_REGISTERED -> "REPOSITORY";
            case COMMIT_RECEIVED -> "WEBHOOK";
            case REVIEW_FLAG_CREATED, REVIEW_FLAG_REVIEWED -> "REVIEW";
            case TEAM_REGISTERED -> "TEAM";
            case PARTICIPANT_REGISTERED, PARTICIPANT_UPDATED, PARTICIPANT_REMOVED -> "PARTICIPANT";
        };
    }

    private String mapAuditActionToTitle(AuditLog.AuditAction action, Team team) {
        String teamSuffix = team != null ? " (Team " + team.getTeamNumber() + ")" : "";
        if (action == null) return "Administrative Audit Event";
        return switch (action) {
            case EVENT_RELEASED -> "Event Start Released";
            case SPRINT_RELEASED -> "Development Sprint Released";
            case SPRINT_FROZEN -> "Development Sprint Frozen";
            case CHECKPOINT_CREATED -> "Sprint Checkpoint Created" + teamSuffix;
            case REPOSITORY_REGISTERED -> "GitHub Repository Registered" + teamSuffix;
            case REPOSITORY_ARCHIVED -> "GitHub Repository Archived" + teamSuffix;
            case REPOSITORY_UNARCHIVED -> "GitHub Repository Unarchived" + teamSuffix;
            case COMMIT_RECEIVED -> "GitHub Webhook Push Received" + teamSuffix;
            case REVIEW_FLAG_CREATED -> "Review Flag Logged" + teamSuffix;
            case REVIEW_FLAG_REVIEWED -> "Review Flag Resolved" + teamSuffix;
            case TEAM_REGISTERED -> "IdeaX Team Registered" + teamSuffix;
            case PARTICIPANT_REGISTERED -> "Official Participant Registered" + teamSuffix;
            case PARTICIPANT_UPDATED -> "Official Participant Updated" + teamSuffix;
            case PARTICIPANT_REMOVED -> "Official Participant Removed" + teamSuffix;
        };
    }
}
