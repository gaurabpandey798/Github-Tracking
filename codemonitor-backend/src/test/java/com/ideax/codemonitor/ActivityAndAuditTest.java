package com.ideax.codemonitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ActivityAndAuditTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private GitRepositoryRepository repositoryRepository;

    @Autowired
    private CommitRepository commitRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ReviewFlagRepository reviewFlagRepository;

    @Value("${security.admin.username:admin}")
    private String adminUser;

    @Value("${security.admin.password:password123}")
    private String adminPassword;

    private Team testTeam;
    private GitRepository testRepo;

    @BeforeEach
    void setUp() {
        testTeam = teamRepository.save(Team.builder()
                .teamNumber(25)
                .teamName("Team Twenty-Five")
                .build());

        testRepo = repositoryRepository.save(GitRepository.builder()
                .githubRepositoryId(999925L)
                .owner("MBMC-IdeaX")
                .name("Team-25-Repo")
                .fullName("MBMC-IdeaX/Team-25-Repo")
                .url("https://github.com/MBMC-IdeaX/Team-25-Repo")
                .defaultBranch("main")
                .team(testTeam)
                .build());

        // 1. Commit entity
        commitRepository.save(CommitEntity.builder()
                .githubCommitSha("sha-activity-001")
                .repository(testRepo)
                .team(testTeam)
                .authorUsername("activity-dev")
                .message("Implement activity feature")
                .committedAt(LocalDateTime.now().minusHours(2))
                .additions(45)
                .deletions(5)
                .changedFiles(2)
                .build());

        // 2. Audit log
        auditLogRepository.save(AuditLog.builder()
                .action(AuditLog.AuditAction.SPRINT_RELEASED)
                .actor("organizer-lead")
                .teamId(testTeam.getId())
                .repositoryId(testRepo.getId())
                .sprintId(1L)
                .note("Sprint 1 officially released")
                .build());

        // 3. Review flag
        reviewFlagRepository.save(ReviewFlag.builder()
                .team(testTeam)
                .repository(testRepo)
                .type(ReviewFlag.ReviewFlagType.UNKNOWN_CONTRIBUTOR)
                .severity(ReviewFlag.ReviewFlagSeverity.HIGH)
                .title("Review Recommended: Unknown Contributor")
                .description("Commit by unknown author")
                .status(ReviewFlag.ReviewFlagStatus.OPEN)
                .build());
    }

    @Test
    @DisplayName("Should return unified activity feed with pagination")
    void testGetActivityFeed() throws Exception {
        mockMvc.perform(get("/api/admin/activity?page=0&size=10")
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    @DisplayName("Should filter activity feed by teamId")
    void testFilterByTeamId() throws Exception {
        mockMvc.perform(get("/api/admin/activity?teamId=" + testTeam.getId())
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isNotEmpty())
                .andExpect(jsonPath("$.items[0].teamNumber").value(25));
    }

    @Test
    @DisplayName("Should filter activity feed by type COMMIT")
    void testFilterByTypeCommit() throws Exception {
        mockMvc.perform(get("/api/admin/activity?type=COMMIT")
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isNotEmpty())
                .andExpect(jsonPath("$.items[0].type").value("COMMIT"));
    }

    @Test
    @DisplayName("Should filter activity feed by severity HIGH")
    void testFilterBySeverityHigh() throws Exception {
        mockMvc.perform(get("/api/admin/activity?severity=HIGH")
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isNotEmpty())
                .andExpect(jsonPath("$.items[0].severity").value("HIGH"))
                .andExpect(jsonPath("$.items[0].requiresReview").value(true));
    }

    @Test
    @DisplayName("Should return administrative audit logs with pagination")
    void testGetAuditLogs() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs?page=0&size=10")
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].action").exists())
                .andExpect(jsonPath("$.items[0].actor").exists());
    }

    @Test
    @DisplayName("Should reject modification to audit logs (Immutability check)")
    void testAuditLogImmutability() throws Exception {
        // POST to /api/admin/audit-logs should not be mapped / allowed
        mockMvc.perform(post("/api/admin/audit-logs")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"TEST\"}"))
                .andExpect(status().isMethodNotAllowed());

        // DELETE to /api/admin/audit-logs/1 should not be mapped (not found)
        mockMvc.perform(delete("/api/admin/audit-logs/1")
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should reject unauthenticated access to activity and audit logs (401)")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/admin/activity"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/audit-logs"))
                .andExpect(status().isUnauthorized());
    }
}
