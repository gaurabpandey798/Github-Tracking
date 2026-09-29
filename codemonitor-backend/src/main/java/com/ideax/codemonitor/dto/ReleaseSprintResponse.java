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
public class ReleaseSprintResponse {
    private Integer sprintNumber;
    private String sprintName;
    private String status;
    private String releaseNote;
    private LocalDateTime releasedAt;
    @Builder.Default
    private List<String> unarchivedRepositories = new ArrayList<>();
    @Builder.Default
    private List<String> failures = new ArrayList<>();
}
