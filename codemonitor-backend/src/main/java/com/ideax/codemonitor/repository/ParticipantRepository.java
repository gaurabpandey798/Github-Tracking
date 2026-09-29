package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    List<Participant> findByTeamId(Long teamId);
    Optional<Participant> findByTeamIdAndGithubUsernameIgnoreCase(Long teamId, String githubUsername);
    Optional<Participant> findByTeamIdAndGithubUserId(Long teamId, Long githubUserId);
    boolean existsByTeamIdAndGithubUsernameIgnoreCase(Long teamId, String githubUsername);
}
