package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findBySprintIdOrderByCreatedAtDesc(Long sprintId);
    List<AuditLog> findByTeamIdOrderByCreatedAtDesc(Long teamId);
    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
