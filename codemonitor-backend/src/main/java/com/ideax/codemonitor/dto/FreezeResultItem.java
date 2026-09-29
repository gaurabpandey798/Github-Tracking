package com.ideax.codemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FreezeResultItem {
    private Integer teamNumber;
    private String teamName;
    private String repository;
    private String status; // FROZEN, FAILED, SKIPPED
    private String message; // e.g. "Checkpoint Recorded"
    private String checkpointSha;
    private int commitCount;
    private int filesChanged;
    private int additions;
    private int deletions;
    private String errorMessage;
}
