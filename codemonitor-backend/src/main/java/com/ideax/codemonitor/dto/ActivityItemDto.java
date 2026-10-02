package com.ideax.codemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityItemDto {
    private String id;
    private String type;         // COMMIT, SPRINT, CHECKPOINT, REPOSITORY, PARTICIPANT, REVIEW, WEBHOOK, AUDIT
    private String action;       // Specific action or flag type
    private String title;
    private String description;
    private LocalDateTime timestamp;
    private String severity;     // INFO, WARNING, MEDIUM, HIGH
    private Long teamId;
    private Integer teamNumber;
    private String teamName;
    private Long repositoryId;
    private String repositoryName;
    private String actor;
    private String githubUsername;
    private String status;
    private boolean requiresReview;
    private Map<String, Object> metadata;
}
