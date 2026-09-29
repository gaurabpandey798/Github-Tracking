package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.*;
import com.ideax.codemonitor.service.CheckpointService;
import com.ideax.codemonitor.service.SprintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sprints")
@Tag(name = "Admin Sprint Controller", description = "Operations for controlling Sprint development phases, freeze, and release")
public class AdminSprintController {

    private final SprintService sprintService;
    private final CheckpointService checkpointService;

    public AdminSprintController(SprintService sprintService, CheckpointService checkpointService) {
        this.sprintService = sprintService;
        this.checkpointService = checkpointService;
    }

    @GetMapping
    @Operation(summary = "List all hackathon sprints", description = "Retrieves an ordered list of all 8 sprints with their current status and metadata.")
    public ResponseEntity<List<SprintSummaryResponse>> listSprints() {
        return ResponseEntity.ok(sprintService.listSprints());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed sprint information", description = "Retrieves sprint details including team checkpoints, recent commits, and review flags.")
    public ResponseEntity<SprintDetailResponse> getSprintDetail(@PathVariable("id") Long id) {
        return ResponseEntity.ok(sprintService.getSprintDetail(id));
    }

    @PostMapping("/{sprintId}/freeze")
    @Operation(summary = "Sprint Frozen (Audit Checkpoint)",
               description = "Creates immutable audit checkpoints for all teams, fetches HEAD commit SHA, computes statistics, marks sprint FROZEN (Checkpoint Recorded). Does not archive or lock GitHub repositories.")
    public ResponseEntity<FreezeSprintResponse> freezeSprint(@PathVariable("sprintId") Long sprintId,
                                                             @Valid @RequestBody FreezeSprintRequest request,
                                                             Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        FreezeSprintResponse response = checkpointService.freezeSprint(sprintId, request.getNote(), actor);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sprintId}/release")
    @Operation(summary = "Release the next sprint",
               description = "Verifies previous sprint is FROZEN, activates target sprint normally, and records audit logs.")
    public ResponseEntity<ReleaseSprintResponse> releaseSprint(@PathVariable("sprintId") Long sprintId,
                                                               @Valid @RequestBody ReleaseSprintRequest request,
                                                               Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        ReleaseSprintResponse response = sprintService.releaseSprint(sprintId, request.getNote(), actor);
        return ResponseEntity.ok(response);
    }
}
