package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.EventStatusResponse;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.exception.InvalidStateTransitionException;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private static final Logger log = LoggerFactory.getLogger(EventService.class);

    private final EventStateRepository eventStateRepository;
    private final SprintRepository sprintRepository;
    private final TeamRepository teamRepository;
    private final ParticipantRepository participantRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final ReviewFlagRepository reviewFlagRepository;
    private final GithubClient githubClient;
    private final AuditLogService auditLogService;

    public EventService(EventStateRepository eventStateRepository,
                        SprintRepository sprintRepository,
                        TeamRepository teamRepository,
                        ParticipantRepository participantRepository,
                        GitRepositoryRepository gitRepositoryRepository,
                        ReviewFlagRepository reviewFlagRepository,
                        GithubClient githubClient,
                        AuditLogService auditLogService) {
        this.eventStateRepository = eventStateRepository;
        this.sprintRepository = sprintRepository;
        this.teamRepository = teamRepository;
        this.participantRepository = participantRepository;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.reviewFlagRepository = reviewFlagRepository;
        this.githubClient = githubClient;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public EventStatusResponse getEventStatus() {
        EventState state = eventStateRepository.getGlobalEventState()
                .orElseGet(() -> EventState.builder()
                        .id(1)
                        .status(EventState.EventStatus.NOT_STARTED)
                        .build());

        Sprint currentSprint = null;
        if (state.getCurrentSprintNumber() != null) {
            currentSprint = sprintRepository.findBySprintNumber(state.getCurrentSprintNumber()).orElse(null);
        } else {
            currentSprint = sprintRepository.findByStatus(Sprint.SprintStatus.ACTIVE).orElse(null);
        }

        long teamCount = teamRepository.count();
        long participantCount = participantRepository.count();
        long repositoryCount = gitRepositoryRepository.count();
        long openFlags = reviewFlagRepository.countByStatus(ReviewFlag.ReviewFlagStatus.OPEN);

        return EventStatusResponse.builder()
                .eventStatus(state.getStatus())
                .currentSprintNumber(currentSprint != null ? currentSprint.getSprintNumber() : null)
                .currentSprintName(currentSprint != null ? currentSprint.getName() : null)
                .currentSprintStatus(currentSprint != null ? currentSprint.getStatus().name() : null)
                .teamCount(teamCount)
                .participantCount(participantCount)
                .repositoryCount(repositoryCount)
                .openReviewFlags(openFlags)
                .startedAt(state.getStartedAt())
                .completedAt(state.getCompletedAt())
                .build();
    }

    @Transactional
    public EventStatusResponse releaseEvent(String note, String actor) {
        if (!StringUtils.hasText(note) || note.trim().length() < 3) {
            throw new IllegalArgumentException("Release note is mandatory and must have at least 3 characters");
        }

        EventState state = eventStateRepository.getGlobalEventState()
                .orElseGet(() -> EventState.builder().id(1).status(EventState.EventStatus.NOT_STARTED).build());

        if (state.getStatus() == EventState.EventStatus.ACTIVE) {
            throw InvalidStateTransitionException.eventAlreadyActive();
        }

        if (state.getStatus() == EventState.EventStatus.COMPLETED) {
            throw InvalidStateTransitionException.eventCompleted();
        }

        LocalDateTime now = LocalDateTime.now();
        state.setStatus(EventState.EventStatus.ACTIVE);
        state.setCurrentSprintNumber(1);
        state.setReleaseNote(note.trim());
        state.setStartedAt(now);
        eventStateRepository.save(state);

        // Activate Sprint 1
        Sprint sprint1 = sprintRepository.findBySprintNumber(1)
                .orElseThrow(() -> new IllegalStateException("Sprint 1 not found in database. Migrations may be missing."));

        sprint1.setStatus(Sprint.SprintStatus.ACTIVE);
        sprint1.setReleaseNote(note.trim());
        sprint1.setReleasedAt(now);
        sprint1.setReleasedBy(actor != null ? actor : "admin");
        sprintRepository.save(sprint1);

        // Repositories are not archived or unarchived on GitHub (remain active throughout)

        auditLogService.logAction(
                AuditLog.AuditAction.EVENT_RELEASED,
                actor,
                null,
                null,
                null,
                sprint1.getId(),
                note.trim(),
                "{\"status\":\"ACTIVE\",\"sprint\":1}"
        );

        auditLogService.logAction(
                AuditLog.AuditAction.SPRINT_RELEASED,
                actor,
                null,
                null,
                null,
                sprint1.getId(),
                note.trim(),
                "{\"sprint\":1,\"name\":\"" + sprint1.getName() + "\"}"
        );

        log.info("Event successfully released! Sprint 1 is now ACTIVE.");
        return getEventStatus();
    }
}
