package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "checkpoints", uniqueConstraints = {
    @UniqueConstraint(name = "uq_checkpoints_sprint_team", columnNames = {"sprint_id", "team_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Checkpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id", nullable = false)
    private Sprint sprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private GitRepository repository;

    @Column(name = "commit_sha", nullable = false, length = 100)
    private String commitSha;

    @Column(name = "commit_count", nullable = false)
    @Builder.Default
    private int commitCount = 0;

    @Column(name = "developer_count", nullable = false)
    @Builder.Default
    private int developerCount = 0;

    @Column(name = "files_changed", nullable = false)
    @Builder.Default
    private int filesChanged = 0;

    @Column(name = "additions", nullable = false)
    @Builder.Default
    private int additions = 0;

    @Column(name = "deletions", nullable = false)
    @Builder.Default
    private int deletions = 0;

    @Column(name = "first_activity_at")
    private LocalDateTime firstActivityAt;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "CREATED";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
