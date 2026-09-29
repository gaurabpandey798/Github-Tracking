package com.ideax.codemonitor.service;

import com.ideax.codemonitor.entity.AuditLog;
import com.ideax.codemonitor.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog logAction(AuditLog.AuditAction action,
                              String actor,
                              String actorId,
                              Long teamId,
                              Long repositoryId,
                              Long sprintId,
                              String note,
                              String metadataJson) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .actor(actor != null ? actor : "system")
                .actorId(actorId)
                .teamId(teamId)
                .repositoryId(repositoryId)
                .sprintId(sprintId)
                .note(note)
                .metadataJson(metadataJson)
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("AUDIT LOG [{}]: actor='{}', teamId={}, repoId={}, sprintId={}, note='{}'",
                action, actor, teamId, repositoryId, sprintId, note);
        return saved;
    }
}
