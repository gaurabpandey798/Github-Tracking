package com.ideax.codemonitor.github;

import com.ideax.codemonitor.dto.RegisterRepositoryRequest;
import com.ideax.codemonitor.entity.AuditLog;
import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.exception.ApiException;
import com.ideax.codemonitor.exception.DuplicateResourceException;
import com.ideax.codemonitor.exception.GitHubRepositoryNotFoundException;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.github.dto.GithubBranchDto;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.GitRepositoryRepository;
import com.ideax.codemonitor.repository.TeamRepository;
import com.ideax.codemonitor.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class GithubRepositoryService {

    private static final Logger log = LoggerFactory.getLogger(GithubRepositoryService.class);

    private final GithubClient githubClient;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final TeamRepository teamRepository;
    private final GithubProperties githubProperties;
    private final AuditLogService auditLogService;

    public GithubRepositoryService(GithubClient githubClient,
                                   GitRepositoryRepository gitRepositoryRepository,
                                   TeamRepository teamRepository,
                                   GithubProperties githubProperties,
                                   AuditLogService auditLogService) {
        this.githubClient = githubClient;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.teamRepository = teamRepository;
        this.githubProperties = githubProperties;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public GitRepository registerRepository(RegisterRepositoryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Registration request cannot be null");
        }

        // 1. Validate team exists
        Team team;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamId()));
        } else if (request.getTeamNumber() != null) {
            team = teamRepository.findByTeamNumber(request.getTeamNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamNumber()));
        } else {
            throw new IllegalArgumentException("teamId or teamNumber must be provided");
        }

        // 2. Validate repository name and owner
        String repoName = request.getName() != null ? request.getName().trim() : "";
        if (repoName.isBlank()) {
            throw new IllegalArgumentException("Repository name cannot be blank");
        }

        String configuredOrg = githubProperties.getOrganization();
        String owner = (request.getOwner() != null && !request.getOwner().isBlank())
                ? request.getOwner().trim()
                : configuredOrg;

        if (configuredOrg != null && !configuredOrg.isBlank() && !owner.equalsIgnoreCase(configuredOrg)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ORGANIZATION",
                    "Repository must belong to organization " + configuredOrg);
        }

        // 3. Duplicate check: Team already mapped to a repository?
        Optional<GitRepository> existingTeamRepo = gitRepositoryRepository.findByTeamId(team.getId());
        if (existingTeamRepo.isPresent()) {
            throw new DuplicateResourceException(
                    String.format("Team %d is already mapped to repository %s.", team.getTeamNumber(), existingTeamRepo.get().getFullName())
            );
        }

        // 4. Duplicate check: Repository already registered by fullName?
        String expectedFullName = owner + "/" + repoName;
        Optional<GitRepository> existingByFullName = gitRepositoryRepository.findByFullNameIgnoreCase(expectedFullName);
        if (existingByFullName.isPresent()) {
            throw new DuplicateResourceException(
                    String.format("Repository %s is already registered.", existingByFullName.get().getFullName())
            );
        }

        // 5. Verify repository exists on GitHub
        GithubRepoDto dto = githubClient.getRepository(owner, repoName)
                .orElseThrow(() -> new GitHubRepositoryNotFoundException(owner, repoName));

        // 6. Duplicate check: Repository already registered by GitHub ID?
        Optional<GitRepository> existingById = gitRepositoryRepository.findByGithubRepositoryId(dto.getId());
        if (existingById.isPresent()) {
            throw new DuplicateResourceException(
                    String.format("Repository %s is already registered.", existingById.get().getFullName())
            );
        }

        // 7. Create CodeMonitor repository record & associate with team
        GitRepository repo = GitRepository.builder()
                .githubRepositoryId(dto.getId())
                .owner(dto.getOwner() != null ? dto.getOwner().getLogin() : owner)
                .name(dto.getName())
                .fullName(dto.getFullName())
                .url(dto.getHtmlUrl())
                .defaultBranch(dto.getDefaultBranch() != null ? dto.getDefaultBranch() : "main")
                .isPrivate(dto.isPrivate())
                .isArchived(dto.isArchived())
                .team(team)
                .build();

        repo = gitRepositoryRepository.save(repo);

        team.setRepositoryId(repo.getId());
        teamRepository.save(team);

        // 8. Log audit action
        auditLogService.logAction(
                AuditLog.AuditAction.REPOSITORY_REGISTERED,
                "admin",
                null,
                team.getId(),
                repo.getId(),
                null,
                String.format("Registered repository %s for Team %d", repo.getFullName(), team.getTeamNumber()),
                null
        );

        log.info("Registered repository {} (ID: {}) for team: {}", repo.getFullName(), repo.getId(), team.getTeamNumber());
        return repo;
    }

    @Transactional
    public GitRepository fetchAndSyncRepository(String owner, String repoName, Long teamId) {
        GithubRepoDto dto = githubClient.getRepository(owner, repoName)
                .orElseThrow(() -> new GitHubRepositoryNotFoundException(owner, repoName));

        Team team = null;
        if (teamId != null) {
            team = teamRepository.findById(teamId).orElse(null);
        }

        Optional<GitRepository> existingOpt = gitRepositoryRepository.findByGithubRepositoryId(dto.getId());
        GitRepository repo;

        if (existingOpt.isPresent()) {
            repo = existingOpt.get();
            repo.setName(dto.getName());
            repo.setFullName(dto.getFullName());
            repo.setUrl(dto.getHtmlUrl());
            repo.setDefaultBranch(dto.getDefaultBranch() != null ? dto.getDefaultBranch() : "main");
            repo.setPrivate(dto.isPrivate());
            repo.setArchived(dto.isArchived());
            if (team != null) {
                repo.setTeam(team);
            }
        } else {
            repo = GitRepository.builder()
                    .githubRepositoryId(dto.getId())
                    .owner(dto.getOwner() != null ? dto.getOwner().getLogin() : owner)
                    .name(dto.getName())
                    .fullName(dto.getFullName())
                    .url(dto.getHtmlUrl())
                    .defaultBranch(dto.getDefaultBranch() != null ? dto.getDefaultBranch() : "main")
                    .isPrivate(dto.isPrivate())
                    .isArchived(dto.isArchived())
                    .team(team)
                    .build();
        }

        repo = gitRepositoryRepository.save(repo);

        if (team != null) {
            team.setRepositoryId(repo.getId());
            teamRepository.save(team);
        }

        log.info("Synced repository {} (ID: {}) with team: {}", repo.getFullName(), repo.getId(), team != null ? team.getTeamNumber() : "None");
        return repo;
    }

    @Transactional
    public GitRepository archiveRepository(GitRepository repository) {
        log.info("Archiving repository {}...", repository.getFullName());
        GithubRepoDto updated = githubClient.updateRepositoryArchived(repository.getOwner(), repository.getName(), true);
        repository.setArchived(updated.isArchived());
        return gitRepositoryRepository.save(repository);
    }

    @Transactional
    public GitRepository unarchiveRepository(GitRepository repository) {
        log.info("Unarchiving repository {}...", repository.getFullName());
        GithubRepoDto updated = githubClient.updateRepositoryArchived(repository.getOwner(), repository.getName(), false);
        repository.setArchived(updated.isArchived());
        return gitRepositoryRepository.save(repository);
    }

    public Optional<String> getHeadSha(GitRepository repository) {
        String branch = repository.getDefaultBranch() != null ? repository.getDefaultBranch() : "main";
        Optional<GithubBranchDto> branchDto = githubClient.getBranch(repository.getOwner(), repository.getName(), branch);
        if (branchDto.isPresent() && branchDto.get().getCommit() != null) {
            return Optional.ofNullable(branchDto.get().getCommit().getSha());
        }

        // Fallback: list latest commit
        var commits = githubClient.listCommits(repository.getOwner(), repository.getName(), branch, null);
        if (!commits.isEmpty()) {
            return Optional.ofNullable(commits.getFirst().getSha());
        }

        return Optional.empty();
    }
}
