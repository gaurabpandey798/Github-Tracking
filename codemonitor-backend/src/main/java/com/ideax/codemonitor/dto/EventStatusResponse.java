package com.ideax.codemonitor.dto;

import com.ideax.codemonitor.entity.EventState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventStatusResponse {
    private EventState.EventStatus eventStatus;
    private Integer currentSprintNumber;
    private String currentSprintName;
    private String currentSprintStatus;
    private long teamCount;
    private long participantCount;
    private long repositoryCount;
    private long openReviewFlags;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
