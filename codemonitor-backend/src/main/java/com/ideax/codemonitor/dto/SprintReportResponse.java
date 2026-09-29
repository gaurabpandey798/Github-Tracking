package com.ideax.codemonitor.dto;

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
public class SprintReportResponse {
    private Integer sprintNumber;
    private String sprintName;
    private String status;
    private LocalDateTime releasedAt;
    private LocalDateTime frozenAt;
    private int teamCompletionCount;
    private int totalTeams;
    private int totalCommits;
    private int totalAdditions;
    private int totalDeletions;
    private int flagsCount;

    @Builder.Default
    private List<TeamSprintCheckpointDto> checkpoints = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamSprintCheckpointDto {
        private Integer teamNumber;
        private String teamName;
        private String repositoryName;
        private String commitSha;
        private int commitCount;
        private int developerCount;
        private int additions;
        private int deletions;
        private int filesChanged;
        private LocalDateTime lastActivityAt;
        private String status;
    }
}
