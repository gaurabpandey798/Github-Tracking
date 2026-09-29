package com.ideax.codemonitor.dto;

import com.ideax.codemonitor.entity.ReviewFlag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamReportResponse {
    private Long teamId;
    private Integer teamNumber;
    private String teamName;
    private String teamStatus;
    private RepositorySummaryDto repository;
    @Builder.Default
    private List<ParticipantSummaryDto> participants = new ArrayList<>();
    private long totalCommits;
    private long uniqueContributors;
    private int totalFilesChanged;
    private int totalAdditions;
    private int totalDeletions;

    @Builder.Default
    private List<SprintCommitStatDto> commitsBySprint = new ArrayList<>();

    @Builder.Default
    private List<CheckpointHistoryDto> checkpointHistory = new ArrayList<>();

    @Builder.Default
    private List<ReviewFlagSummaryDto> reviewFlags = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepositorySummaryDto {
        private Long id;
        private String fullName;
        private String url;
        private String defaultBranch;
        private boolean isArchived;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantSummaryDto {
        private Long id;
        private String githubUsername;
        private Long githubUserId;
        private String displayName;
        private String role;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintCommitStatDto {
        private Integer sprintNumber;
        private String sprintName;
        private int commitCount;
        private int additions;
        private int deletions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckpointHistoryDto {
        private Integer sprintNumber;
        private String commitSha;
        private int commitCount;
        private int filesChanged;
        private int additions;
        private int deletions;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewFlagSummaryDto {
        private Long id;
        private ReviewFlag.ReviewFlagType type;
        private ReviewFlag.ReviewFlagSeverity severity;
        private String title;
        private String description;
        private ReviewFlag.ReviewFlagStatus status;
        private LocalDateTime createdAt;
    }
}
