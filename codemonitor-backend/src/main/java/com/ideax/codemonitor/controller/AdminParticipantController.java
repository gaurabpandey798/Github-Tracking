package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.CreateParticipantRequest;
import com.ideax.codemonitor.dto.ParticipantResponse;
import com.ideax.codemonitor.dto.ParticipantSyncResponse;
import com.ideax.codemonitor.dto.UpdateParticipantRequest;
import com.ideax.codemonitor.service.ParticipantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/participants")
@Tag(name = "Admin Participant Controller", description = "Operations for managing official event participants")
public class AdminParticipantController {

    private final ParticipantService participantService;

    public AdminParticipantController(ParticipantService participantService) {
        this.participantService = participantService;
    }

    @GetMapping
    @Operation(summary = "List all participants", description = "Retrieves all officially registered participants, optionally filtered by teamId.")
    public ResponseEntity<List<ParticipantResponse>> listParticipants(
            @RequestParam(required = false) Long teamId) {
        return ResponseEntity.ok(participantService.listParticipants(teamId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get participant by ID", description = "Retrieves details of a registered participant.")
    public ResponseEntity<ParticipantResponse> getParticipant(@PathVariable Long id) {
        return ResponseEntity.ok(participantService.getParticipant(id));
    }

    @PostMapping
    @Operation(summary = "Register a new participant", description = "Registers an official participant for a team.")
    public ResponseEntity<ParticipantResponse> createParticipant(
            @Valid @RequestBody CreateParticipantRequest request,
            Principal principal) {
        String actor = principal != null ? principal.getName() : "admin";
        ParticipantResponse response = participantService.createParticipant(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update participant details", description = "Updates an official participant's information.")
    public ResponseEntity<ParticipantResponse> updateParticipant(
            @PathVariable Long id,
            @Valid @RequestBody UpdateParticipantRequest request,
            Principal principal) {
        String actor = principal != null ? principal.getName() : "admin";
        ParticipantResponse response = participantService.updateParticipant(id, request, actor);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a participant", description = "Removes an official participant while preserving all commit activity.")
    public ResponseEntity<Void> deleteParticipant(
            @PathVariable Long id,
            Principal principal) {
        String actor = principal != null ? principal.getName() : "admin";
        participantService.deleteParticipant(id, actor);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sync-from-github")
    @Operation(summary = "Sync participants from GitHub teams",
               description = "Fetches organization teams and their assigned repositories and members from GitHub, linking teams and creating participants.")
    public ResponseEntity<ParticipantSyncResponse> syncParticipantsFromGithub(
            @RequestParam(required = false) Long teamId,
            Principal principal) {
        String actor = principal != null ? principal.getName() : "admin";
        ParticipantSyncResponse response = participantService.syncParticipantsFromGithub(teamId, actor);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unassigned-members")
    @Operation(summary = "Get unassigned organization members",
               description = "Returns GitHub members in the organization who have not yet been assigned to any hackathon team.")
    public ResponseEntity<List<com.ideax.codemonitor.github.dto.GithubUserDto>> getUnassignedMembers() {
        return ResponseEntity.ok(participantService.getUnassignedOrgMembers());
    }
}
