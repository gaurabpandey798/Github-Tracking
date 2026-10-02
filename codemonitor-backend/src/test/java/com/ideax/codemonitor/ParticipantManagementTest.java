package com.ideax.codemonitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideax.codemonitor.dto.CreateParticipantRequest;
import com.ideax.codemonitor.dto.UpdateParticipantRequest;
import com.ideax.codemonitor.entity.AuditLog;
import com.ideax.codemonitor.entity.CommitEntity;
import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.repository.AuditLogRepository;
import com.ideax.codemonitor.repository.CommitRepository;
import com.ideax.codemonitor.repository.GitRepositoryRepository;
import com.ideax.codemonitor.repository.ParticipantRepository;
import com.ideax.codemonitor.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ParticipantManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private GitRepositoryRepository repositoryRepository;

    @Autowired
    private CommitRepository commitRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @MockBean
    private GithubClient githubClient;

    @Value("${security.admin.username:admin}")
    private String adminUser;

    @Value("${security.admin.password:password123}")
    private String adminPassword;

    private Team team1;
    private Team team2;
    private GitRepository repo1;

    @BeforeEach
    void setUp() {
        team1 = teamRepository.save(Team.builder()
                .teamNumber(10)
                .teamName("Team Ten")
                .build());

        team2 = teamRepository.save(Team.builder()
                .teamNumber(11)
                .teamName("Team Eleven")
                .build());

        repo1 = repositoryRepository.save(GitRepository.builder()
                .githubRepositoryId(999901L)
                .owner("MBMC-IdeaX")
                .name("Team-Ten-Repo")
                .fullName("MBMC-IdeaX/Team-Ten-Repo")
                .url("https://github.com/MBMC-IdeaX/Team-Ten-Repo")
                .defaultBranch("main")
                .team(team1)
                .build());

        when(githubClient.getUserIdByUsername(anyString())).thenReturn(Optional.of(888123L));
    }

    @Test
    @DisplayName("Should successfully register a new participant and log audit entry")
    void testCreateParticipantSuccess() throws Exception {
        CreateParticipantRequest request = CreateParticipantRequest.builder()
                .teamId(team1.getId())
                .githubUsername("dev-alice")
                .displayName("Alice Hacker")
                .role("LEAD")
                .build();

        mockMvc.perform(post("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.githubUsername").value("dev-alice"))
                .andExpect(jsonPath("$.displayName").value("Alice Hacker"))
                .andExpect(jsonPath("$.teamNumber").value(10))
                .andExpect(jsonPath("$.role").value("LEAD"))
                .andExpect(jsonPath("$.status").value("REGISTERED"));

        // Verify participant in DB
        var participantOpt = participantRepository.findByTeamIdAndGithubUsernameIgnoreCase(team1.getId(), "dev-alice");
        assertThat(participantOpt).isPresent();

        // Verify audit log
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        boolean hasAudit = auditLogs.stream().anyMatch(a ->
                a.getAction() == AuditLog.AuditAction.PARTICIPANT_REGISTERED &&
                a.getNote().contains("dev-alice"));
        assertThat(hasAudit).isTrue();
    }

    @Test
    @DisplayName("Should reject duplicate participant registration in same team (409)")
    void testDuplicateInSameTeam() throws Exception {
        CreateParticipantRequest request = CreateParticipantRequest.builder()
                .teamId(team1.getId())
                .githubUsername("dev-bob")
                .displayName("Bob")
                .build();

        mockMvc.perform(post("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Repeated post with same username
        mockMvc.perform(post("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("Should reject duplicate participant registration across different teams (409)")
    void testDuplicateAcrossTeams() throws Exception {
        CreateParticipantRequest req1 = CreateParticipantRequest.builder()
                .teamId(team1.getId())
                .githubUsername("dev-charlie")
                .displayName("Charlie")
                .build();

        mockMvc.perform(post("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Attempt assigning to team2
        CreateParticipantRequest req2 = CreateParticipantRequest.builder()
                .teamId(team2.getId())
                .githubUsername("DEV-CHARLIE") // Case insensitive check
                .displayName("Charlie Duplicate")
                .build();

        mockMvc.perform(post("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("Should reject nonexistent team ID (404)")
    void testCreateParticipantTeamNotFound() throws Exception {
        CreateParticipantRequest request = CreateParticipantRequest.builder()
                .teamId(99999L)
                .githubUsername("dev-ghost")
                .build();

        mockMvc.perform(post("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("Should reject validation failure on missing username or team (400)")
    void testCreateParticipantValidationFailure() throws Exception {
        String invalidJson = "{\"teamId\": null, \"githubUsername\": \"\"}";

        mockMvc.perform(post("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should list participants filtered by teamId")
    void testListParticipantsWithFilter() throws Exception {
        createParticipantDirect("p1", team1);
        createParticipantDirect("p2", team2);

        // Filter by team 1
        mockMvc.perform(get("/api/admin/participants?teamId=" + team1.getId())
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].githubUsername").value("p1"));

        // List all
        mockMvc.perform(get("/api/admin/participants")
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("Should update participant details and log audit entry")
    void testUpdateParticipant() throws Exception {
        var p = createParticipantDirect("update-me", team1);

        UpdateParticipantRequest updateReq = UpdateParticipantRequest.builder()
                .displayName("Updated Name")
                .role("FRONTEND_LEAD")
                .build();

        mockMvc.perform(put("/api/admin/participants/" + p.getId())
                        .with(httpBasic(adminUser, adminPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated Name"))
                .andExpect(jsonPath("$.role").value("FRONTEND_LEAD"));

        // Verify audit log
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        boolean hasAudit = auditLogs.stream().anyMatch(a ->
                a.getAction() == AuditLog.AuditAction.PARTICIPANT_UPDATED &&
                a.getNote().contains("update-me"));
        assertThat(hasAudit).isTrue();
    }

    @Test
    @DisplayName("Should delete participant while preserving all commit activity and foreign key relations")
    void testDeleteParticipantPreservesCommits() throws Exception {
        var p = createParticipantDirect("committer-dave", team1);

        // Create commit associated with participant
        CommitEntity commit = commitRepository.save(CommitEntity.builder()
                .githubCommitSha("sha-1234567890abcdef")
                .repository(repo1)
                .team(team1)
                .participant(p)
                .authorGithubUserId(888123L)
                .authorUsername("committer-dave")
                .message("Test commit by dave")
                .committedAt(LocalDateTime.now())
                .additions(10)
                .deletions(2)
                .changedFiles(1)
                .build());

        assertThat(commit.getParticipant()).isNotNull();

        // Delete participant
        mockMvc.perform(delete("/api/admin/participants/" + p.getId())
                        .with(httpBasic(adminUser, adminPassword)))
                .andExpect(status().isNoContent());

        // Verify participant is deleted
        assertThat(participantRepository.findById(p.getId())).isEmpty();

        // Verify commit STILL exists and historical activity is preserved
        Optional<CommitEntity> commitAfterDelete = commitRepository.findById(commit.getId());
        assertThat(commitAfterDelete).isPresent();
        assertThat(commitAfterDelete.get().getAuthorUsername()).isEqualTo("committer-dave");
        assertThat(commitAfterDelete.get().getParticipant()).isNull(); // Participant reference detached safely

        // Verify audit log
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        boolean hasAudit = auditLogs.stream().anyMatch(a ->
                a.getAction() == AuditLog.AuditAction.PARTICIPANT_REMOVED &&
                a.getNote().contains("committer-dave"));
        assertThat(hasAudit).isTrue();
    }

    @Test
    @DisplayName("Should reject unauthorized participant management requests without basic auth (401)")
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/admin/participants"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/admin/participants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private com.ideax.codemonitor.entity.Participant createParticipantDirect(String username, Team team) {
        return participantRepository.save(com.ideax.codemonitor.entity.Participant.builder()
                .team(team)
                .githubUsername(username)
                .displayName("Name " + username)
                .githubUserId(888000L)
                .role("MEMBER")
                .status("REGISTERED")
                .build());
    }
}
