package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GitRepositoryRepository extends JpaRepository<GitRepository, Long> {
    Optional<GitRepository> findByGithubRepositoryId(Long githubRepositoryId);
    Optional<GitRepository> findByFullNameIgnoreCase(String fullName);
    Optional<GitRepository> findByNameIgnoreCase(String name);

    @Query("SELECT r FROM GitRepository r WHERE r.team.id = :teamId")
    Optional<GitRepository> findByTeamId(@Param("teamId") Long teamId);

    Optional<GitRepository> findByTeam(Team team);
}
