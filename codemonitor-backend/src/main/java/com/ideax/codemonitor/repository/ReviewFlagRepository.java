package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.ReviewFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewFlagRepository extends JpaRepository<ReviewFlag, Long> {
    List<ReviewFlag> findByTeamId(Long teamId);
    List<ReviewFlag> findBySprintId(Long sprintId);
    List<ReviewFlag> findByStatus(ReviewFlag.ReviewFlagStatus status);
    long countByStatus(ReviewFlag.ReviewFlagStatus status);
    boolean existsByRepositoryIdAndCommitShaAndType(Long repositoryId, String commitSha, ReviewFlag.ReviewFlagType type);
    boolean existsByTeamIdAndSprintIdAndType(Long teamId, Long sprintId, ReviewFlag.ReviewFlagType type);
}
