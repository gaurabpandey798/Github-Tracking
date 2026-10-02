package com.ideax.codemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantResponse {
    private Long id;
    private Long teamId;
    private Integer teamNumber;
    private String teamName;
    private Long githubUserId;
    private String githubUsername;
    private String displayName;
    private String role;
    private String status;
    private long commitCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
