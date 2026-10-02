package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.CreateTeamRequest;
import com.ideax.codemonitor.entity.AuditLog;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.exception.DuplicateResourceException;
import com.ideax.codemonitor.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {

    private static final Logger log = LoggerFactory.getLogger(TeamService.class);

    private final TeamRepository teamRepository;
    private final AuditLogService auditLogService;

    public TeamService(TeamRepository teamRepository, AuditLogService auditLogService) {
        this.teamRepository = teamRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<Team> listTeams() {
        return teamRepository.findAll();
    }

    @Transactional
    public Team createTeam(CreateTeamRequest request) {
        if (teamRepository.findByTeamNumber(request.getTeamNumber()).isPresent()) {
            throw new DuplicateResourceException(
                    String.format("Team with number %d already exists.", request.getTeamNumber())
            );
        }

        Team team = Team.builder()
                .teamNumber(request.getTeamNumber())
                .teamName(request.getTeamName().trim())
                .status("ACTIVE")
                .build();

        team = teamRepository.save(team);

        auditLogService.logAction(
                AuditLog.AuditAction.TEAM_REGISTERED,
                "admin",
                null,
                team.getId(),
                null,
                null,
                String.format("Registered Team %d: %s", team.getTeamNumber(), team.getTeamName()),
                null
        );

        log.info("Registered team ID={} number={} name={}", team.getId(), team.getTeamNumber(), team.getTeamName());
        return team;
    }
}
