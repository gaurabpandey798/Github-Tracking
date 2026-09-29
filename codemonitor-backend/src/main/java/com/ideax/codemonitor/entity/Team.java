package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_number", nullable = false, unique = true)
    private Integer teamNumber;

    @Column(name = "team_name", nullable = false, length = 100)
    private String teamName;

    @Column(name = "github_team_id")
    private Long githubTeamId;

    @Column(name = "github_team_slug", length = 100)
    private String githubTeamSlug;

    @Column(name = "repository_id")
    private Long repositoryId;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @OneToOne(mappedBy = "team", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private GitRepository repository;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Participant> participants = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
