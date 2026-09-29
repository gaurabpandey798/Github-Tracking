package com.ideax.codemonitor.dto;

import com.ideax.codemonitor.entity.ReviewFlag;
import com.ideax.codemonitor.entity.Sprint;
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
public class SprintDetailResponse {
    private Long id;
    private Integer sprintNumber;
    private String name;
    private Sprint.SprintStatus status;
    private String releaseNote;
    private String freezeNote;
    private LocalDateTime releasedAt;
    private String releasedBy;
    private LocalDateTime frozenAt;
    private String frozenBy;

    @Builder.Default
    private List<CheckpointSummaryDto> checkpoints = new ArrayList<>();

    @Builder.Default
    private List<CommitSummaryDto> recentCommits = new ArrayList<>();

    @Builder.Default
    private List<ReviewFlagSummaryDto> reviewFlags = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckpointSummaryDto {
        private Long checkpointId;
        private Integer teamNumber;
        private String teamName;
        private String repositoryName;
        private String commitSha;
        private int commitCount;
        private int developerCount;
        private int filesChanged;
        private int additions;
        private int deletions;
        private LocalDateTime firstActivityAt;
        private LocalDateTime lastActivityAt;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitSummaryDto {
        private String commitSha;
        private String authorUsername;
        private String message;
        private LocalDateTime committedAt;
        private int additions;
        private int deletions;
        private int changedFiles;
        private Integer teamNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewFlagSummaryDto {
        private Long id;
        private Integer teamNumber;
        private ReviewFlag.ReviewFlagType type;
        private ReviewFlag.ReviewFlagSeverity severity;
        private String title;
        private String description;
        private ReviewFlag.ReviewFlagStatus status;
        private String commitSha;
        private LocalDateTime createdAt;
    }
}
