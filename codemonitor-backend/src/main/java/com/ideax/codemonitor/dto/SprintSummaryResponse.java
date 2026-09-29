package com.ideax.codemonitor.dto;

import com.ideax.codemonitor.entity.Sprint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintSummaryResponse {
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
    private int checkpointsCount;
}
