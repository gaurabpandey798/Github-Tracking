package com.ideax.codemonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "commits", uniqueConstraints = {
    @UniqueConstraint(name = "uq_commits_repo_sha", columnNames = {"repository_id", "github_commit_sha"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "github_commit_sha", nullable = false, length = 100)
    private String githubCommitSha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private GitRepository repository;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id")
    private Participant participant;

    @Column(name = "author_github_user_id")
    private Long authorGithubUserId;

    @Column(name = "author_username", nullable = false, length = 100)
    private String authorUsername;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 100)
    private String branch;

    @Column(name = "committed_at", nullable = false)
    private LocalDateTime committedAt;

    @Column(name = "github_created_at")
    private LocalDateTime githubCreatedAt;

    @Column(nullable = false)
    @Builder.Default
    private int additions = 0;

    @Column(nullable = false)
    @Builder.Default
    private int deletions = 0;

    @Column(name = "changed_files", nullable = false)
    @Builder.Default
    private int changedFiles = 0;

    @Column(name = "commit_url", length = 500)
    private String commitUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
