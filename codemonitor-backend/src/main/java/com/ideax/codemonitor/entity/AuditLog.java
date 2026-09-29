package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AuditAction action;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(name = "actor_id", length = 100)
    private String actorId;

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "repository_id")
    private Long repositoryId;

    @Column(name = "sprint_id")
    private Long sprintId;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AuditAction {
        EVENT_RELEASED,
        SPRINT_RELEASED,
        SPRINT_FROZEN,
        CHECKPOINT_CREATED,
        REPOSITORY_ARCHIVED,
        REPOSITORY_UNARCHIVED,
        COMMIT_RECEIVED,
        REVIEW_FLAG_CREATED,
        REVIEW_FLAG_REVIEWED
    }
}
