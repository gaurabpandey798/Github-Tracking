package com.ideax.codemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventReportResponse {
    private String eventStatus;
    private Integer currentSprintNumber;
    private long totalTeams;
    private long totalParticipants;
    private long totalRepositories;
    private long totalCommits;
    private long totalContributors;
    private long totalReviewFlags;
    private long openReviewFlags;
    private long totalCheckpointsCreated;
    private double checkpointCompletionPercentage;
    @Builder.Default
    private List<SprintSummaryDto> sprints = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintSummaryDto {
        private Integer sprintNumber;
        private String name;
        private String status;
        private int checkpointsCount;
    }
}
