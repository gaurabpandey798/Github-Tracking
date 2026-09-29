package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.EventStatusResponse;
import com.ideax.codemonitor.dto.ReleaseEventRequest;
import com.ideax.codemonitor.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/event")
@Tag(name = "Admin Event Controller", description = "Operations for controlling the overarching Hackathon Event lifecycle")
public class AdminEventController {

    private final EventService eventService;

    public AdminEventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    @Operation(summary = "Get overall hackathon event status",
               description = "Returns the current event status, active sprint, counts for teams, participants, repositories, and open review flags.")
    public ResponseEntity<EventStatusResponse> getEventStatus() {
        return ResponseEntity.ok(eventService.getEventStatus());
    }

    @PostMapping("/release")
    @Operation(summary = "Release the event and activate Sprint 1",
               description = "Transition event from NOT_STARTED to ACTIVE, set Sprint 1 to ACTIVE, and record audit log.")
    public ResponseEntity<EventStatusResponse> releaseEvent(@Valid @RequestBody ReleaseEventRequest request,
                                                           Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        EventStatusResponse response = eventService.releaseEvent(request.getNote(), actor);
        return ResponseEntity.ok(response);
    }
}
