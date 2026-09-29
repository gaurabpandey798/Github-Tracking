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
public class FreezeSprintResponse {
    private String sprint;
    private Integer sprintNumber;
    private String status; // SUCCESS, PARTIAL_FAILURE, FAILED
    private String message; // e.g. "Sprint Frozen (Audit Checkpoint)"
    @Builder.Default
    private List<FreezeResultItem> results = new ArrayList<>();
    @Builder.Default
    private List<String> failures = new ArrayList<>();
}
