package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sprints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sprint_number", nullable = false, unique = true)
    private Integer sprintNumber;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private SprintStatus status = SprintStatus.NOT_STARTED;

    @Column(name = "release_note", columnDefinition = "TEXT")
    private String releaseNote;

    @Column(name = "freeze_note", columnDefinition = "TEXT")
    private String freezeNote;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "released_by", length = 100)
    private String releasedBy;

    @Column(name = "frozen_at")
    private LocalDateTime frozenAt;

    @Column(name = "frozen_by", length = 100)
    private String frozenBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum SprintStatus {
        NOT_STARTED,
        ACTIVE,
        FROZEN,
        COMPLETED
    }
}
