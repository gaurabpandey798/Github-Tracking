package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventState {

    @Id
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventStatus status;

    @Column(name = "current_sprint_number")
    private Integer currentSprintNumber;

    @Column(name = "release_note", columnDefinition = "TEXT")
    private String releaseNote;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum EventStatus {
        NOT_STARTED,
        ACTIVE,
        COMPLETED
    }
}
