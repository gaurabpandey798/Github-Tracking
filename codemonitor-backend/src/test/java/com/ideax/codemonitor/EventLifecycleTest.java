package com.ideax.codemonitor;

import com.ideax.codemonitor.dto.EventStatusResponse;
import com.ideax.codemonitor.dto.FreezeSprintResponse;
import com.ideax.codemonitor.dto.ReleaseSprintResponse;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.exception.InvalidStateTransitionException;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.dto.GithubBranchDto;
import com.ideax.codemonitor.github.dto.GithubCommitDto;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.repository.*;
import com.ideax.codemonitor.service.CheckpointService;
import com.ideax.codemonitor.service.CommitSyncService;
import com.ideax.codemonitor.service.EventService;
import com.ideax.codemonitor.service.SprintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class EventLifecycleTest {

    @Autowired
    private EventService eventService;

    @Autowired
    private SprintService sprintService;

    @Autowired
    private CheckpointService checkpointService;

    @Autowired
    private CommitSyncService commitSyncService;

    @Autowired
    private EventStateRepository eventStateRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private GitRepositoryRepository gitRepositoryRepository;

    @Autowired
    private CheckpointRepository checkpointRepository;

    @MockBean
    private GithubClient githubClient;

    private Team testTeam;
    private GitRepository testRepo;

    @BeforeEach
    void setUp() {
        // Mock GitHub Client defaults
        when(githubClient.updateRepositoryArchived(anyString(), anyString(), eq(true)))
                .thenReturn(GithubRepoDto.builder().isArchived(true).build());

        when(githubClient.updateRepositoryArchived(anyString(), anyString(), eq(false)))
                .thenReturn(GithubRepoDto.builder().isArchived(false).build());

        when(githubClient.getBranch(anyString(), anyString(), anyString()))
                .thenReturn(Optional.of(GithubBranchDto.builder()
                        .name("main")
                        .commit(new GithubBranchDto.BranchCommit("abc123headsha", "http://commit.url"))
                        .build()));

        when(githubClient.listCommits(anyString(), anyString(), anyString(), any()))
                .thenReturn(Collections.emptyList());

        // Setup test team and repo
        testTeam = teamRepository.findByTeamNumber(1).orElseGet(() ->
                teamRepository.save(Team.builder().teamNumber(1).teamName("Team 4NF").build())
        );

        testRepo = gitRepositoryRepository.findByFullNameIgnoreCase("MBMC-IdeaX/Team-4NF").orElseGet(() -> {
            GitRepository repo = GitRepository.builder()
                    .githubRepositoryId(1391942535L)
                    .owner("MBMC-IdeaX")
                    .name("Team-4NF")
                    .fullName("MBMC-IdeaX/Team-4NF")
                    .url("https://github.com/MBMC-IdeaX/Team-4NF")
                    .defaultBranch("main")
                    .isPrivate(true)
                    .isArchived(false)
                    .team(testTeam)
                    .build();
            return gitRepositoryRepository.save(repo);
        });

        testTeam.setRepositoryId(testRepo.getId());
        teamRepository.save(testTeam);
    }

    @Test
    @DisplayName("Requirement 1: Event release requires a non-blank note")
    void eventRelease_RequiresNote() {
        assertThatThrownBy(() -> eventService.releaseEvent("", "organizer"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> eventService.releaseEvent("   ", "organizer"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Requirement 2: Event release activates Sprint 1 and sets event status to ACTIVE")
    void eventRelease_ActivatesSprint1() {
        EventStatusResponse response = eventService.releaseEvent("IdeaX 2026 Officially Started", "organizer");

        assertThat(response.getEventStatus()).isEqualTo(EventState.EventStatus.ACTIVE);
        assertThat(response.getCurrentSprintNumber()).isEqualTo(1);
        assertThat(response.getCurrentSprintStatus()).isEqualTo("ACTIVE");

        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();
        assertThat(sprint1.getStatus()).isEqualTo(Sprint.SprintStatus.ACTIVE);
        assertThat(sprint1.getReleaseNote()).isEqualTo("IdeaX 2026 Officially Started");
        assertThat(sprint1.getReleasedBy()).isEqualTo("organizer");
        assertThat(sprint1.getReleasedAt()).isNotNull();
    }

    @Test
    @DisplayName("Requirement 3: Freeze requires a non-blank note")
    void freeze_RequiresNote() {
        eventService.releaseEvent("Start Event", "organizer");
        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();

        assertThatThrownBy(() -> checkpointService.freezeSprint(sprint1.getId(), "", "organizer"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> checkpointService.freezeSprint(sprint1.getId(), "   ", "organizer"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Requirement 4 & 5: Freeze creates immutable audit checkpoint without archiving repository")
    void freeze_CreatesCheckpointWithoutArchivingRepo() {
        eventService.releaseEvent("Start Event", "organizer");
        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();

        FreezeSprintResponse freezeResponse = checkpointService.freezeSprint(sprint1.getId(), "Dev Sprint 1 ended", "organizer");

        assertThat(freezeResponse.getStatus()).isEqualTo("SUCCESS");
        assertThat(freezeResponse.getMessage()).isEqualTo("Sprint Frozen (Audit Checkpoint)");
        assertThat(freezeResponse.getResults()).hasSize(1);
        assertThat(freezeResponse.getResults().get(0).getStatus()).isEqualTo("FROZEN");
        assertThat(freezeResponse.getResults().get(0).getMessage()).isEqualTo("Checkpoint Recorded");
        assertThat(freezeResponse.getResults().get(0).getCheckpointSha()).isEqualTo("abc123headsha");

        // Verify Checkpoint entity
        Optional<Checkpoint> cpOpt = checkpointRepository.findBySprintIdAndTeamId(sprint1.getId(), testTeam.getId());
        assertThat(cpOpt).isPresent();
        assertThat(cpOpt.get().getCommitSha()).isEqualTo("abc123headsha");

        // Verify sprint is FROZEN
        Sprint updatedSprint = sprintRepository.findBySprintNumber(1).orElseThrow();
        assertThat(updatedSprint.getStatus()).isEqualTo(Sprint.SprintStatus.FROZEN);
        assertThat(updatedSprint.getFreezeNote()).isEqualTo("Dev Sprint 1 ended");

        // Verify GitHub archive call was NEVER called
        verify(githubClient, never()).updateRepositoryArchived(anyString(), anyString(), anyBoolean());
        GitRepository repoAfterFreeze = gitRepositoryRepository.findById(testRepo.getId()).orElseThrow();
        assertThat(repoAfterFreeze.isArchived()).isFalse();
    }

    @Test
    @DisplayName("Requirement 6: Freeze cannot happen twice")
    void freeze_CannotHappenTwice() {
        eventService.releaseEvent("Start Event", "organizer");
        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();

        checkpointService.freezeSprint(sprint1.getId(), "Dev Sprint 1 ended", "organizer");

        // Attempt second freeze
        assertThatThrownBy(() -> checkpointService.freezeSprint(sprint1.getId(), "Dev Sprint 1 second attempt", "organizer"))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("already frozen");
    }

    @Test
    @DisplayName("Requirement 7, 8 & 9: Release Sprint 2 requires previous sprint frozen, activates normally without unarchiving")
    void releaseSprint2_RequiresPreviousFrozen_AndActivatesNormally() {
        eventService.releaseEvent("Start Event", "organizer");
        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();
        Sprint sprint2 = sprintRepository.findBySprintNumber(2).orElseThrow();

        // Releasing Sprint 2 before Sprint 1 is frozen must fail
        assertThatThrownBy(() -> sprintService.releaseSprint(sprint2.getId(), "Sprint 2 starts", "organizer"))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("Previous sprint must be FROZEN");

        // Freeze Sprint 1
        checkpointService.freezeSprint(sprint1.getId(), "Dev Sprint 1 ended", "organizer");

        // Now release Sprint 2
        ReleaseSprintResponse releaseResponse = sprintService.releaseSprint(sprint2.getId(), "Sprint 2 starts", "organizer");

        assertThat(releaseResponse.getStatus()).isEqualTo("ACTIVE");
        assertThat(releaseResponse.getSprintNumber()).isEqualTo(2);

        // Verify GitHub unarchive call was NEVER called
        verify(githubClient, never()).updateRepositoryArchived(anyString(), anyString(), anyBoolean());

        Sprint updatedSprint2 = sprintRepository.findBySprintNumber(2).orElseThrow();
        assertThat(updatedSprint2.getStatus()).isEqualTo(Sprint.SprintStatus.ACTIVE);
        assertThat(updatedSprint2.getReleaseNote()).isEqualTo("Sprint 2 starts");
    }

    @Test
    @DisplayName("Requirement 8: Commits occurring after checkpoint SHA during freeze are tracked as post-checkpoint activity")
    void postCheckpointActivity_IsTrackedDuringFreeze() {
        eventService.releaseEvent("Start Event", "organizer");
        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();

        // Freeze Sprint 1
        checkpointService.freezeSprint(sprint1.getId(), "Dev Sprint 1 ended", "organizer");

        // Mock GitHub returning a commit after the checkpoint SHA
        when(githubClient.listCommits(eq("MBMC-IdeaX"), eq("Team-4NF"), eq("main"), any()))
                .thenReturn(List.of(
                        GithubCommitDto.builder()
                                .sha("post-freeze-commit-999")
                                .commit(new GithubCommitDto.CommitDetails("Late commit after freeze",
                                        new GithubCommitDto.GitAuthor("coder1", "coder1@mbmc.edu", "2026-09-28T12:30:00Z"),
                                        new GithubCommitDto.GitAuthor("coder1", "coder1@mbmc.edu", "2026-09-28T12:30:00Z")))
                                .author(new GithubCommitDto.GithubUser(111L, "coder1"))
                                .build()
                ));

        var syncResponse = commitSyncService.syncRepository(testRepo.getId());

        assertThat(syncResponse.getNewCommitsCount()).isEqualTo(1);
        assertThat(syncResponse.getFlagsCreated()).anyMatch(f -> f.contains("POST_CHECKPOINT_ACTIVITY"));
    }

    @Test
    @DisplayName("Requirement 12: Checkpoint is not duplicated on retry")
    void checkpoint_IsNotDuplicated() {
        eventService.releaseEvent("Start Event", "organizer");
        Sprint sprint1 = sprintRepository.findBySprintNumber(1).orElseThrow();

        // First checkpoint
        checkpointRepository.save(Checkpoint.builder()
                .sprint(sprint1)
                .team(testTeam)
                .repository(testRepo)
                .commitSha("original-immutable-sha")
                .commitCount(5)
                .status("CREATED")
                .build());

        // Now run freeze
        checkpointService.freezeSprint(sprint1.getId(), "Freeze with existing checkpoint", "organizer");

        // Checkpoint count for (sprint1, testTeam) must remain exactly 1
        assertThat(checkpointRepository.findBySprintId(sprint1.getId())).hasSize(1);
        Checkpoint cp = checkpointRepository.findBySprintIdAndTeamId(sprint1.getId(), testTeam.getId()).orElseThrow();
        // Immutable original SHA preserved
        assertThat(cp.getCommitSha()).isEqualTo("original-immutable-sha");
    }
}
