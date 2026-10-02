package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByTeamNumber(Integer teamNumber);
    Optional<Team> findByRepositoryId(Long repositoryId);
    Optional<Team> findByGithubTeamSlugIgnoreCase(String githubTeamSlug);
    Optional<Team> findByTeamNameIgnoreCase(String teamName);
}
