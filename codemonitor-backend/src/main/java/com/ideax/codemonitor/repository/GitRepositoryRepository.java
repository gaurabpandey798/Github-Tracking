package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.GitRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GitRepositoryRepository extends JpaRepository<GitRepository, Long> {
    Optional<GitRepository> findByGithubRepositoryId(Long githubRepositoryId);
    Optional<GitRepository> findByFullNameIgnoreCase(String fullName);
    Optional<GitRepository> findByNameIgnoreCase(String name);
    Optional<GitRepository> findByTeamId(Long teamId);
}
