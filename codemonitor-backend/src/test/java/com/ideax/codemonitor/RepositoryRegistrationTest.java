package com.ideax.codemonitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideax.codemonitor.dto.CreateTeamRequest;
import com.ideax.codemonitor.dto.RegisterRepositoryRequest;
import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.exception.GitHubApiException;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.GitRepositoryRepository;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class RepositoryRegistrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private GitRepositoryRepository gitRepositoryRepository;

    @MockBean
    private GithubClient githubClient;

    @Value("${security.admin.username:admin}")
    private String adminUser;

    @Value("${security.admin.password:password123}")
    private String adminPass;

    private Team team1;

    @BeforeEach
    void setUp() {
        team1 = teamRepository.findByTeamNumber(1).orElseGet(() ->
                teamRepository.save(Team.builder()
                        .teamNumber(1)
                        .teamName("Team 4NF")
                        .status("ACTIVE")
                        .build())
        );
    }

    @Test
    @DisplayName("A. Successful repository registration with teamId")
    void testSuccessfulRepositoryRegistration() throws Exception {
        Team team2 = teamRepository.save(Team.builder()
                .teamNumber(2)
                .teamName("Team ABC")
                .status("ACTIVE")
                .build());

        GithubRepoDto repoDto = GithubRepoDto.builder()
                .id(987654321L)
                .name("Team-ABC")
                .fullName("MBMC-IdeaX/Team-ABC")
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-ABC")
                .defaultBranch("main")
                .isPrivate(true)
                .isArchived(false)
                .owner(new GithubRepoDto.OwnerDto(333035973L, "MBMC-IdeaX"))
                .build();

        when(githubClient.getRepository("MBMC-IdeaX", "Team-ABC"))
                .thenReturn(Optional.of(repoDto));

        RegisterRepositoryRequest request = RegisterRepositoryRequest.builder()
                .teamId(team2.getId())
                .owner("MBMC-IdeaX")
                .name("Team-ABC")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.githubRepositoryId").value(987654321L))
                .andExpect(jsonPath("$.name").value("Team-ABC"))
                .andExpect(jsonPath("$.fullName").value("MBMC-IdeaX/Team-ABC"))
                .andExpect(jsonPath("$.teamId").value(team2.getId()))
                .andExpect(jsonPath("$.teamNumber").value(2));

        // Verify database state
        Optional<GitRepository> saved = gitRepositoryRepository.findByGithubRepositoryId(987654321L);
        assertThat(saved).isPresent();
        assertThat(saved.get().getTeam().getId()).isEqualTo(team2.getId());

        Team updatedTeam = teamRepository.findById(team2.getId()).orElseThrow();
        assertThat(updatedTeam.getRepositoryId()).isEqualTo(saved.get().getId());
    }

    @Test
    @DisplayName("B. Team does not exist returns 404 NOT_FOUND")
    void testRegistration_TeamDoesNotExist() throws Exception {
        RegisterRepositoryRequest request = RegisterRepositoryRequest.builder()
                .teamId(99999L)
                .owner("MBMC-IdeaX")
                .name("Team-ABC")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("C. GitHub repository does not exist returns 404 NOT_FOUND")
    void testRegistration_GithubRepoNotFound() throws Exception {
        Team team2 = teamRepository.save(Team.builder()
                .teamNumber(2)
                .teamName("Team 02")
                .status("ACTIVE")
                .build());

        when(githubClient.getRepository("MBMC-IdeaX", "NonExistentRepo"))
                .thenReturn(Optional.empty());

        RegisterRepositoryRequest request = RegisterRepositoryRequest.builder()
                .teamId(team2.getId())
                .owner("MBMC-IdeaX")
                .name("NonExistentRepo")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("GITHUB_REPOSITORY_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("GitHub repository MBMC-IdeaX/NonExistentRepo was not found or is not accessible."));
    }

    @Test
    @DisplayName("D. Duplicate repository returns 409 CONFLICT")
    void testRegistration_DuplicateRepository() throws Exception {
        Team team2 = teamRepository.save(Team.builder()
                .teamNumber(2)
                .teamName("Team 02")
                .status("ACTIVE")
                .build());

        Team team3 = teamRepository.save(Team.builder()
                .teamNumber(3)
                .teamName("Team 03")
                .status("ACTIVE")
                .build());

        GithubRepoDto repoDto = GithubRepoDto.builder()
                .id(888888888L)
                .name("Team-XYZ")
                .fullName("MBMC-IdeaX/Team-XYZ")
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-XYZ")
                .defaultBranch("main")
                .isPrivate(true)
                .isArchived(false)
                .owner(new GithubRepoDto.OwnerDto(333035973L, "MBMC-IdeaX"))
                .build();

        when(githubClient.getRepository("MBMC-IdeaX", "Team-XYZ"))
                .thenReturn(Optional.of(repoDto));

        // First registration succeeds
        RegisterRepositoryRequest req1 = RegisterRepositoryRequest.builder()
                .teamId(team2.getId())
                .owner("MBMC-IdeaX")
                .name("Team-XYZ")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Second registration with same repository name returns 409 Conflict
        RegisterRepositoryRequest req2 = RegisterRepositoryRequest.builder()
                .teamId(team3.getId())
                .owner("MBMC-IdeaX")
                .name("Team-XYZ")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"))
                .andExpect(jsonPath("$.message").value("Repository MBMC-IdeaX/Team-XYZ is already registered."));
    }

    @Test
    @DisplayName("E. Duplicate team mapping returns 409 CONFLICT")
    void testRegistration_DuplicateTeamMapping() throws Exception {
        Team team2 = teamRepository.save(Team.builder()
                .teamNumber(2)
                .teamName("Team 02")
                .status("ACTIVE")
                .build());

        GithubRepoDto repo1 = GithubRepoDto.builder()
                .id(11111111L)
                .name("Team-One")
                .fullName("MBMC-IdeaX/Team-One")
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-One")
                .defaultBranch("main")
                .isPrivate(true)
                .isArchived(false)
                .owner(new GithubRepoDto.OwnerDto(333035973L, "MBMC-IdeaX"))
                .build();

        GithubRepoDto repo2 = GithubRepoDto.builder()
                .id(22222222L)
                .name("Team-Two")
                .fullName("MBMC-IdeaX/Team-Two")
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-Two")
                .defaultBranch("main")
                .isPrivate(true)
                .isArchived(false)
                .owner(new GithubRepoDto.OwnerDto(333035973L, "MBMC-IdeaX"))
                .build();

        when(githubClient.getRepository("MBMC-IdeaX", "Team-One")).thenReturn(Optional.of(repo1));
        when(githubClient.getRepository("MBMC-IdeaX", "Team-Two")).thenReturn(Optional.of(repo2));

        // First repo for team 2 succeeds
        RegisterRepositoryRequest req1 = RegisterRepositoryRequest.builder()
                .teamId(team2.getId())
                .name("Team-One")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Attempting to register another repo for team 2 returns 409 Conflict
        RegisterRepositoryRequest req2 = RegisterRepositoryRequest.builder()
                .teamId(team2.getId())
                .name("Team-Two")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"))
                .andExpect(jsonPath("$.message").value("Team 2 is already mapped to repository MBMC-IdeaX/Team-One."));
    }

    @Test
    @DisplayName("F. GitHub API failure returns 502 BAD_GATEWAY")
    void testRegistration_GithubApiFailure() throws Exception {
        Team team2 = teamRepository.save(Team.builder()
                .teamNumber(2)
                .teamName("Team 02")
                .status("ACTIVE")
                .build());

        when(githubClient.getRepository("MBMC-IdeaX", "ErrorRepo"))
                .thenThrow(new GitHubApiException("Failed to communicate with GitHub API"));

        RegisterRepositoryRequest request = RegisterRepositoryRequest.builder()
                .teamId(team2.getId())
                .name("ErrorRepo")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("GITHUB_API_ERROR"));
    }

    @Test
    @DisplayName("G. Unauthorized request returns 401 UNAUTHORIZED")
    void testRegistration_Unauthorized() throws Exception {
        RegisterRepositoryRequest request = RegisterRepositoryRequest.builder()
                .teamId(1L)
                .name("Team-4NF")
                .build();

        mockMvc.perform(post("/api/admin/repositories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("H. Existing Team-4NF setup endpoint still works without errors")
    void testExistingTeam4NF_StillWorks() throws Exception {
        GithubRepoDto initialRepoDto = GithubRepoDto.builder()
                .id(1391942535L)
                .name("Team-4NF")
                .fullName("MBMC-IdeaX/Team-4NF")
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-4NF")
                .defaultBranch("main")
                .isPrivate(true)
                .isArchived(false)
                .owner(new GithubRepoDto.OwnerDto(333035973L, "MBMC-IdeaX"))
                .build();

        when(githubClient.getRepository("MBMC-IdeaX", "Team-4NF"))
                .thenReturn(Optional.of(initialRepoDto));

        when(githubClient.listCommits(eq("MBMC-IdeaX"), eq("Team-4NF"), eq("main"), any()))
                .thenReturn(java.util.Collections.emptyList());

        mockMvc.perform(post("/api/admin/repositories/setup-team-4nf")
                        .with(httpBasic(adminUser, adminPass)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newCommitsCount").exists());

        // Verify Team-4NF is still present
        mockMvc.perform(get("/api/admin/repositories")
                        .with(httpBasic(adminUser, adminPass)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Team-4NF"));
    }

    @Test
    @DisplayName("I. Team Registration via /api/admin/teams")
    void testTeamRegistration_SuccessAndDuplicate() throws Exception {
        CreateTeamRequest teamReq = CreateTeamRequest.builder()
                .teamNumber(10)
                .teamName("Team Alpha")
                .build();

        mockMvc.perform(post("/api/admin/teams")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teamReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.teamNumber").value(10))
                .andExpect(jsonPath("$.teamName").value("Team Alpha"));

        // Duplicate team registration returns 409
        mockMvc.perform(post("/api/admin/teams")
                        .with(httpBasic(adminUser, adminPass))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teamReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"))
                .andExpect(jsonPath("$.message").value("Team with number 10 already exists."));
    }
}
