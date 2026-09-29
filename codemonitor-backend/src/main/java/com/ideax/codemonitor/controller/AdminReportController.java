package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.EventReportResponse;
import com.ideax.codemonitor.dto.SprintReportResponse;
import com.ideax.codemonitor.dto.TeamReportResponse;
import com.ideax.codemonitor.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@Tag(name = "Admin Report Controller", description = "Operations for generating event, team, and sprint reports")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/event")
    @Operation(summary = "Get overarching event report",
               description = "Returns aggregated statistics including total teams, commits, contributors, review flags, and checkpoint progress.")
    public ResponseEntity<EventReportResponse> getEventReport() {
        return ResponseEntity.ok(reportService.getEventReport());
    }

    @GetMapping("/teams/{teamId}")
    @Operation(summary = "Get individual team report",
               description = "Returns detailed statistics for a team including commits, sprint activity, checkpoint history, and review flags.")
    public ResponseEntity<TeamReportResponse> getTeamReport(@PathVariable("teamId") Long teamId) {
        return ResponseEntity.ok(reportService.getTeamReport(teamId));
    }

    @GetMapping("/sprints/{sprintId}")
    @Operation(summary = "Get individual sprint report",
               description = "Returns sprint statistics including team checkpoint completion, total additions/deletions, and review flags.")
    public ResponseEntity<SprintReportResponse> getSprintReport(@PathVariable("sprintId") Long sprintId) {
        return ResponseEntity.ok(reportService.getSprintReport(sprintId));
    }
}
