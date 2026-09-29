package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_flags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReviewFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "repository", "participants"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "team"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private GitRepository repository;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ReviewFlagType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewFlagSeverity severity;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "commit_sha", length = 100)
    private String commitSha;

    @Column(name = "evidence_json", columnDefinition = "TEXT")
    private String evidenceJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReviewFlagStatus status = ReviewFlagStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    public enum ReviewFlagType {
        LARGE_COMMIT,
        BULK_CHANGE,
        UNKNOWN_CONTRIBUTOR,
        FORCE_PUSH,
        HISTORY_CHANGE,
        SUDDEN_ACTIVITY,
        NO_ACTIVITY,
        POST_CHECKPOINT_ACTIVITY
    }

    public enum ReviewFlagSeverity {
        LOW,
        MEDIUM,
        HIGH
    }

    public enum ReviewFlagStatus {
        OPEN,
        REVIEWED,
        DISMISSED
    }
}
