package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.ReviewFlagResolutionRequest;
import com.ideax.codemonitor.entity.AuditLog;
import com.ideax.codemonitor.entity.ReviewFlag;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.repository.ReviewFlagRepository;
import com.ideax.codemonitor.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/review-flags")
@Tag(name = "Admin Review Flags Controller", description = "Operations for inspecting and resolving heuristic Review Recommended flags")
public class AdminReviewFlagController {

    private final ReviewFlagRepository reviewFlagRepository;
    private final AuditLogService auditLogService;

    public AdminReviewFlagController(ReviewFlagRepository reviewFlagRepository, AuditLogService auditLogService) {
        this.reviewFlagRepository = reviewFlagRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "List review flags", description = "Retrieves flagged review recommendations, optionally filtered by status.")
    public ResponseEntity<List<ReviewFlag>> listReviewFlags(@RequestParam(name = "status", required = false) ReviewFlag.ReviewFlagStatus status) {
        if (status != null) {
            return ResponseEntity.ok(reviewFlagRepository.findByStatus(status));
        }
        return ResponseEntity.ok(reviewFlagRepository.findAll());
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Resolve or dismiss review flag",
               description = "Marks a Review Recommended flag as REVIEWED or DISMISSED with an organizer note.")
    public ResponseEntity<ReviewFlag> resolveFlag(@PathVariable("id") Long id,
                                                  @Valid @RequestBody ReviewFlagResolutionRequest request,
                                                  Authentication authentication) {
        ReviewFlag flag = reviewFlagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReviewFlag", id));

        String actor = authentication != null ? authentication.getName() : "admin";
        flag.setStatus(request.getStatus());
        flag.setReviewedAt(LocalDateTime.now());
        flag.setReviewedBy(actor);
        flag.setReviewNote(request.getReviewNote());

        ReviewFlag saved = reviewFlagRepository.save(flag);

        auditLogService.logAction(
                AuditLog.AuditAction.REVIEW_FLAG_REVIEWED,
                actor,
                null,
                flag.getTeam().getId(),
                flag.getRepository().getId(),
                flag.getSprint() != null ? flag.getSprint().getId() : null,
                String.format("Flag #%d resolved as %s: %s", id, request.getStatus(), request.getReviewNote()),
                String.format("{\"flagId\":%d,\"status\":\"%s\"}", id, request.getStatus())
        );

        return ResponseEntity.ok(saved);
    }
}
