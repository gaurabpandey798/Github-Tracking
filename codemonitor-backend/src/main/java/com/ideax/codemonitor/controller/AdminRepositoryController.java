package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.dto.RegisterRepositoryRequest;
import com.ideax.codemonitor.dto.RepositorySyncResponse;
import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.github.GithubProperties;
import com.ideax.codemonitor.github.GithubRepositoryService;
import com.ideax.codemonitor.repository.GitRepositoryRepository;
import com.ideax.codemonitor.service.CommitSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/repositories")
@Tag(name = "Admin Repository Controller", description = "Operations for repository registration, commit synchronization, and GitHub integration")
public class AdminRepositoryController {

    private final CommitSyncService commitSyncService;
    private final GithubRepositoryService githubRepositoryService;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final GithubProperties githubProperties;

    public AdminRepositoryController(CommitSyncService commitSyncService,
                                     GithubRepositoryService githubRepositoryService,
                                     GitRepositoryRepository gitRepositoryRepository,
                                     GithubProperties githubProperties) {
        this.commitSyncService = commitSyncService;
        this.githubRepositoryService = githubRepositoryService;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.githubProperties = githubProperties;
    }

    @GetMapping
    @Operation(summary = "List all tracked repositories", description = "Retrieves all registered team repositories.")
    public ResponseEntity<List<GitRepository>> listRepositories() {
        return ResponseEntity.ok(gitRepositoryRepository.findAll());
    }

    @PostMapping
    @Operation(summary = "Register a team GitHub repository",
               description = "Validates team exists, verifies repository on GitHub, checks duplicate protection, and links repository with team.")
    public ResponseEntity<GitRepository> registerRepository(@Valid @RequestBody RegisterRepositoryRequest request) {
        GitRepository repository = githubRepositoryService.registerRepository(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository);
    }

    @PostMapping("/{repositoryId}/sync")
    @Operation(summary = "Synchronize repository commits",
               description = "Fetches recent commits from GitHub, upserts them, checks for unknown contributors and unusual activity.")
    public ResponseEntity<RepositorySyncResponse> syncRepository(@PathVariable("repositoryId") Long repositoryId) {
        RepositorySyncResponse response = commitSyncService.syncRepository(repositoryId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/setup-team-4nf")
    @Operation(summary = "Setup and link Team-4NF for Team 01",
               description = "Fetches MBMC-IdeaX/Team-4NF from GitHub API, links it with Team 01, and performs initial synchronization.")
    public ResponseEntity<RepositorySyncResponse> setupTeam4NF() {
        String org = githubProperties.getOrganization();
        GitRepository repo = githubRepositoryService.fetchAndSyncRepository(org, "Team-4NF", 1L);
        RepositorySyncResponse syncResponse = commitSyncService.syncRepository(repo.getId());
        return ResponseEntity.ok(syncResponse);
    }
}
