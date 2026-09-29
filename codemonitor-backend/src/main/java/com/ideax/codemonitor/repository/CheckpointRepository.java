package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.Checkpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CheckpointRepository extends JpaRepository<Checkpoint, Long> {
    Optional<Checkpoint> findBySprintIdAndTeamId(Long sprintId, Long teamId);
    List<Checkpoint> findBySprintId(Long sprintId);
    List<Checkpoint> findByTeamIdOrderByCreatedAtAsc(Long teamId);
    Optional<Checkpoint> findTopByTeamIdOrderByCreatedAtDesc(Long teamId);
    boolean existsBySprintIdAndTeamId(Long sprintId, Long teamId);
}
