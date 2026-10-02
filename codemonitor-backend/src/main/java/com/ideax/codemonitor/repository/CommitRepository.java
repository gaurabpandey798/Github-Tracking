package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.CommitEntity;
import com.ideax.codemonitor.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommitRepository extends JpaRepository<CommitEntity, Long> {
    Optional<CommitEntity> findByRepositoryIdAndGithubCommitSha(Long repositoryId, String githubCommitSha);
    List<CommitEntity> findByRepositoryIdOrderByCommittedAtDesc(Long repositoryId);
    List<CommitEntity> findByTeamIdOrderByCommittedAtDesc(Long teamId);

    long countByTeamId(Long teamId);
    long countByParticipantId(Long participantId);

    @Query("SELECT COUNT(DISTINCT c.authorUsername) FROM CommitEntity c WHERE c.team.id = :teamId")
    long countDistinctAuthorsByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT c FROM CommitEntity c WHERE c.team.id = :teamId AND c.committedAt BETWEEN :start AND :end ORDER BY c.committedAt ASC")
    List<CommitEntity> findByTeamIdAndCommittedAtBetween(@Param("teamId") Long teamId,
                                                         @Param("start") LocalDateTime start,
                                                         @Param("end") LocalDateTime end);

    @Query("SELECT c FROM CommitEntity c WHERE c.team.id = :teamId AND (:since IS NULL OR c.committedAt >= :since) ORDER BY c.committedAt ASC")
    List<CommitEntity> findByTeamIdSince(@Param("teamId") Long teamId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(c) FROM CommitEntity c WHERE c.team.id = :teamId AND c.committedAt >= :since")
    long countRecentCommits(@Param("teamId") Long teamId, @Param("since") LocalDateTime since);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE CommitEntity c SET c.participant = null WHERE c.participant.id = :participantId")
    void detachParticipant(@Param("participantId") Long participantId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE CommitEntity c SET c.participant = :participant WHERE c.team.id = :teamId AND LOWER(c.authorUsername) = LOWER(:username)")
    void linkParticipantToExistingCommits(@Param("teamId") Long teamId,
                                          @Param("username") String username,
                                          @Param("participant") Participant participant);
}
