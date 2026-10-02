package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GitRepository {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "github_repository_id", nullable = false, unique = true)
    private Long githubRepositoryId;

    @Column(nullable = false, length = 100)
    private String owner;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "default_branch", nullable = false, length = 100)
    @Builder.Default
    private String defaultBranch = "main";

    @Column(name = "is_private", nullable = false)
    @Builder.Default
    private boolean isPrivate = true;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private boolean isArchived = false;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @com.fasterxml.jackson.annotation.JsonProperty("teamId")
    public Long getTeamId() {
        return team != null ? team.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("teamNumber")
    public Integer getTeamNumber() {
        return team != null ? team.getTeamNumber() : null;
    }
}
