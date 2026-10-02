package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.CreateTeamRequest;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/teams")
@Tag(name = "Admin Team Controller", description = "Operations for team registration and retrieval")
public class AdminTeamController {

    private final TeamService teamService;

    public AdminTeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    @Operation(summary = "List all teams", description = "Retrieves all teams registered in CodeMonitor.")
    public ResponseEntity<List<Team>> listTeams() {
        return ResponseEntity.ok(teamService.listTeams());
    }

    @PostMapping
    @Operation(summary = "Register a new team", description = "Creates a new team record for monitoring.")
    public ResponseEntity<Team> createTeam(@Valid @RequestBody CreateTeamRequest request) {
        Team created = teamService.createTeam(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
