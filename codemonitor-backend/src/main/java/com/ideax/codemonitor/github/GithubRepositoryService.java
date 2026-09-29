package com.ideax.codemonitor.github;

import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.github.dto.GithubBranchDto;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.GitRepositoryRepository;
import com.ideax.codemonitor.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class GithubRepositoryService {

    private static final Logger log = LoggerFactory.getLogger(GithubRepositoryService.class);

    private final GithubClient githubClient;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final TeamRepository teamRepository;

    public GithubRepositoryService(GithubClient githubClient,
                                   GitRepositoryRepository gitRepositoryRepository,
                                   TeamRepository teamRepository) {
        this.githubClient = githubClient;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.teamRepository = teamRepository;
    }

    @Transactional
    public GitRepository fetchAndSyncRepository(String owner, String repoName, Long teamId) {
        GithubRepoDto dto = githubClient.getRepository(owner, repoName)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub Repository", owner + "/" + repoName));

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
