package com.ideax.codemonitor.dto;

import com.ideax.codemonitor.entity.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private AuditLog.AuditAction action;
    private String actor;
    private String actorId;
    private Long teamId;
    private Integer teamNumber;
    private String teamName;
    private Long repositoryId;
    private String repositoryName;
    private Long sprintId;
    private String note;
    private String metadataJson;
    private LocalDateTime createdAt;
}
