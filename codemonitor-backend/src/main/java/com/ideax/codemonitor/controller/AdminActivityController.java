package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.ActivityItemDto;
import com.ideax.codemonitor.dto.AuditLogResponse;
import com.ideax.codemonitor.dto.PagedResponse;
import com.ideax.codemonitor.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Activity & Audit Controller", description = "Operations for monitoring chronological event activity and administrative audit logs")
public class AdminActivityController {

    private final ActivityService activityService;

    public AdminActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping("/activity")
    @Operation(summary = "Get unified activity feed",
               description = "Returns a chronological stream of commits, sprint/checkpoint events, review flags, and participant mutations.")
    public ResponseEntity<PagedResponse<ActivityItemDto>> getActivityFeed(
            @RequestParam(name = "teamId", required = false) Long teamId,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "severity", required = false) String severity,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {

        PagedResponse<ActivityItemDto> response = activityService.getActivityFeed(
                teamId, type, severity, from, to, search, page, size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get administrative audit logs",
               description = "Returns immutable records of organizer administrative actions (sprint release/freeze, participant changes, repo registration, review resolutions).")
    public ResponseEntity<PagedResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(name = "teamId", required = false) Long teamId,
            @RequestParam(name = "action", required = false) String action,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {

        PagedResponse<AuditLogResponse> response = activityService.getAuditLogs(teamId, action, page, size);
        return ResponseEntity.ok(response);
    }
}
