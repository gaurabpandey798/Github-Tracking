package com.ideax.codemonitor;

import com.ideax.codemonitor.dto.*;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.GithubRepositoryService;
import com.ideax.codemonitor.github.dto.GithubBranchDto;
import com.ideax.codemonitor.github.dto.GithubCommitDto;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.*;
import com.ideax.codemonitor.service.CheckpointService;
import com.ideax.codemonitor.service.CommitSyncService;
import com.ideax.codemonitor.service.EventService;
import com.ideax.codemonitor.service.SprintService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class Team4NFIntegrationFlowTest {

    @Autowired
    private EventService eventService;

    @Autowired
    private SprintService sprintService;

    @Autowired
    private CheckpointService checkpointService;

    @Autowired
    private CommitSyncService commitSyncService;

    @Autowired
    private GithubRepositoryService githubRepositoryService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private GitRepositoryRepository gitRepositoryRepository;

    @Autowired
    private CheckpointRepository checkpointRepository;

    @Autowired
    private CommitRepository commitRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @MockBean
    private GithubClient githubClient;

    @Test
    @DisplayName("End-to-End Demo Flow: Full Sprint 1 Freeze & Sprint 2 Release lifecycle for Team-4NF")
    void executeTeam4NF_FullLifecycleDemo() {
        // Step 1: Mock GitHub responses for Team-4NF
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

        GithubRepoDto archivedRepoDto = GithubRepoDto.builder()
                .id(1391942535L)
                .name("Team-4NF")
                .fullName("MBMC-IdeaX/Team-4NF")
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-4NF")
                .defaultBranch("main")
                .isPrivate(true)
                .isArchived(true)
                .build();

        when(githubClient.getRepository("MBMC-IdeaX", "Team-4NF"))
                .thenReturn(Optional.of(initialRepoDto));

        when(githubClient.updateRepositoryArchived("MBMC-IdeaX", "Team-4NF", true))
                .thenReturn(archivedRepoDto);

        when(githubClient.updateRepositoryArchived("MBMC-IdeaX", "Team-4NF", false))
                .thenReturn(initialRepoDto);

        when(githubClient.getBranch("MBMC-IdeaX", "Team-4NF", "main"))
                .thenReturn(Optional.of(GithubBranchDto.builder()
                        .name("main")
                        .commit(new GithubBranchDto.BranchCommit("4nf-commit-sha-sprint1", "url"))
                        .build()));

        GithubCommitDto commit1 = GithubCommitDto.builder()
                .sha("4nf-commit-sha-sprint1")
                .commit(new GithubCommitDto.CommitDetails("Initial code for Team 4NF",
                        new GithubCommitDto.GitAuthor("coder1", "coder1@mbmc.edu", "2026-09-28T09:00:00Z"),
                        new GithubCommitDto.GitAuthor("coder1", "coder1@mbmc.edu", "2026-09-28T09:00:00Z")))
                .author(new GithubCommitDto.GithubUser(111L, "coder1"))
                .stats(new GithubCommitDto.CommitStats(150, 140, 10))
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-4NF/commit/4nf-commit-sha-sprint1")
                .build();

        when(githubClient.listCommits(eq("MBMC-IdeaX"), eq("Team-4NF"), eq("main"), any()))
                .thenReturn(List.of(commit1));

        // Step 4 & 5: Find and setup MBMC-IdeaX / Team-4NF for Team 01
        GitRepository repo = githubRepositoryService.fetchAndSyncRepository("MBMC-IdeaX", "Team-4NF", 1L);
        assertThat(repo).isNotNull();
        assertThat(repo.getFullName()).isEqualTo("MBMC-IdeaX/Team-4NF");

        // Step 6 & 7: Fetch Team-4NF commits and save
        RepositorySyncResponse syncResponse1 = commitSyncService.syncRepository(repo.getId());
        assertThat(syncResponse1.getNewCommitsCount()).isEqualTo(1);
        assertThat(syncResponse1.getTotalCommitsCount()).isEqualTo(1);
        assertThat(commitRepository.findByRepositoryIdAndGithubCommitSha(repo.getId(), "4nf-commit-sha-sprint1")).isPresent();

        // Step 8: Release Event
        EventStatusResponse eventStatus = eventService.releaseEvent("Event started", "organizer");
        assertThat(eventStatus.getEventStatus()).isEqualTo(EventState.EventStatus.ACTIVE);
        assertThat(eventStatus.getCurrentSprintNumber()).isEqualTo(1);

        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();
        assertThat(sprint1.getStatus()).isEqualTo(Sprint.SprintStatus.ACTIVE);

        // Step 9: Freeze Sprint 1 with "Dev Sprint 1 ended"
        FreezeSprintResponse freezeResponse = checkpointService.freezeSprint(sprint1.getId(), "Dev Sprint 1 ended", "organizer");

        // Step 10: Capture Team-4NF checkpoint
        assertThat(freezeResponse.getStatus()).isEqualTo("SUCCESS");
        assertThat(freezeResponse.getResults().get(0).getCheckpointSha()).isEqualTo("4nf-commit-sha-sprint1");

        Checkpoint cp = checkpointRepository.findBySprintIdAndTeamId(sprint1.getId(), 1L).orElseThrow();
        assertThat(cp.getCommitSha()).isEqualTo("4nf-commit-sha-sprint1");

        // Step 11 & 12: Verify Team-4NF is NOT archived on GitHub, checkpoint is recorded
        verify(githubClient, never()).updateRepositoryArchived(anyString(), anyString(), eq(true));
        GitRepository repoAfterFreeze = gitRepositoryRepository.findById(repo.getId()).orElseThrow();
        assertThat(repoAfterFreeze.isArchived()).isFalse();
        assertThat(freezeResponse.getMessage()).isEqualTo("Sprint Frozen (Audit Checkpoint)");
        assertThat(freezeResponse.getResults().get(0).getMessage()).isEqualTo("Checkpoint Recorded");

        // Step 13: Release Sprint 2 with "Sprint 2 starts"
        Sprint sprint2 = sprintRepository.findBySprintNumber(2).orElseThrow();
        ReleaseSprintResponse releaseResponse = sprintService.releaseSprint(sprint2.getId(), "Sprint 2 starts", "organizer");

        // Step 14 & 15: Verify Sprint 2 is active and GitHub unarchive is never called
        assertThat(releaseResponse.getStatus()).isEqualTo("ACTIVE");
        verify(githubClient, never()).updateRepositoryArchived(anyString(), anyString(), eq(false));
        GitRepository unarchivedRepo = gitRepositoryRepository.findById(repo.getId()).orElseThrow();
        assertThat(unarchivedRepo.isArchived()).isFalse();

        // Step 16: Sync another commit
        GithubCommitDto commit2 = GithubCommitDto.builder()
                .sha("4nf-commit-sha-sprint2")
                .commit(new GithubCommitDto.CommitDetails("Sprint 2 new feature implementation",
                        new GithubCommitDto.GitAuthor("coder1", "coder1@mbmc.edu", "2026-09-28T11:00:00Z"),
                        new GithubCommitDto.GitAuthor("coder1", "coder1@mbmc.edu", "2026-09-28T11:00:00Z")))
                .author(new GithubCommitDto.GithubUser(111L, "coder1"))
                .stats(new GithubCommitDto.CommitStats(45, 40, 5))
                .htmlUrl("https://github.com/MBMC-IdeaX/Team-4NF/commit/4nf-commit-sha-sprint2")
                .build();

        when(githubClient.listCommits(eq("MBMC-IdeaX"), eq("Team-4NF"), eq("main"), any()))
                .thenReturn(List.of(commit2, commit1));

        RepositorySyncResponse syncResponse2 = commitSyncService.syncRepository(repo.getId());

        // Step 17: Verify second commit appears in the database
        assertThat(syncResponse2.getNewCommitsCount()).isEqualTo(1);
        assertThat(syncResponse2.getTotalCommitsCount()).isEqualTo(2);
        assertThat(commitRepository.findByRepositoryIdAndGithubCommitSha(repo.getId(), "4nf-commit-sha-sprint2")).isPresent();
    }
}
