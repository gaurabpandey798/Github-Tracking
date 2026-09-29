package com.ideax.codemonitor;

import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.repository.*;
import com.ideax.codemonitor.service.UnusualActivityDetectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class UnusualActivityDetectionTest {

    @Autowired
    private UnusualActivityDetectionService unusualActivityDetectionService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private GitRepositoryRepository gitRepositoryRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private CommitRepository commitRepository;

    @Autowired
    private ReviewFlagRepository reviewFlagRepository;

    private Team team;
    private GitRepository repository;
    private Sprint sprint;

    @BeforeEach
    void setup() {
        team = teamRepository.findByTeamNumber(1).orElseGet(() ->
                teamRepository.save(Team.builder().teamNumber(1).teamName("Team 4NF").build())
        );

        // Add registered team member
        participantRepository.save(Participant.builder()
                .team(team)
                .githubUserId(123456L)
                .githubUsername("legitimate-dev")
                .role("MEMBER")
                .status("ACTIVE")
                .build());

        repository = gitRepositoryRepository.findByFullNameIgnoreCase("MBMC-IdeaX/Team-4NF").orElseGet(() ->
                gitRepositoryRepository.save(GitRepository.builder()
                        .githubRepositoryId(1391942535L)
                        .owner("MBMC-IdeaX")
                        .name("Team-4NF")
                        .fullName("MBMC-IdeaX/Team-4NF")
                        .url("https://github.com/MBMC-IdeaX/Team-4NF")
                        .team(team)
                        .build())
        );

        sprint = sprintRepository.findBySprintNumber(1).orElseThrow();
    }

    @Test
    @DisplayName("Requirement 9: Unknown contributor creates UNKNOWN_CONTRIBUTOR review flag")
    void checkUnknownContributor_CreatesFlag() {
        // Unknown contributor 'rogue-outsider'
        Optional<ReviewFlag> flagOpt = unusualActivityDetectionService.checkUnknownContributor(
                team,
                repository,
                sprint,
                "commit-sha-789",
                999999L,
                "rogue-outsider"
        );

        assertThat(flagOpt).isPresent();
        ReviewFlag flag = flagOpt.get();
        assertThat(flag.getType()).isEqualTo(ReviewFlag.ReviewFlagType.UNKNOWN_CONTRIBUTOR);
        assertThat(flag.getSeverity()).isEqualTo(ReviewFlag.ReviewFlagSeverity.HIGH);
        assertThat(flag.getStatus()).isEqualTo(ReviewFlag.ReviewFlagStatus.OPEN);
        assertThat(flag.getTitle()).contains("Review Recommended");
        assertThat(flag.getDescription()).contains("rogue-outsider");
    }

    @Test
    @DisplayName("Registered contributor does NOT create unknown contributor flag")
    void checkKnownContributor_DoesNotCreateFlag() {
        Optional<ReviewFlag> flagOpt = unusualActivityDetectionService.checkUnknownContributor(
                team,
                repository,
                sprint,
                "commit-sha-123",
                123456L,
                "legitimate-dev"
        );

        assertThat(flagOpt).isEmpty();
    }

    @Test
    @DisplayName("Large commit exceeding thresholds creates LARGE_COMMIT review flag")
    void checkLargeCommit_CreatesFlag() {
        CommitEntity commit = CommitEntity.builder()
                .githubCommitSha("large-commit-sha-999")
                .repository(repository)
                .team(team)
                .authorUsername("legitimate-dev")
                .committedAt(LocalDateTime.now())
                .changedFiles(120) // threshold in test is 50
                .additions(6000)
                .deletions(200)
                .build();
        commitRepository.save(commit);

        Optional<ReviewFlag> flagOpt = unusualActivityDetectionService.checkLargeCommit(commit, sprint);

        assertThat(flagOpt).isPresent();
        ReviewFlag flag = flagOpt.get();
        assertThat(flag.getType()).isEqualTo(ReviewFlag.ReviewFlagType.LARGE_COMMIT);
        assertThat(flag.getSeverity()).isEqualTo(ReviewFlag.ReviewFlagSeverity.MEDIUM);
        assertThat(flag.getDescription()).contains("exceeding monitoring thresholds");
    }

    @Test
    @DisplayName("Zero activity during sprint creates NO_ACTIVITY review flag")
    void checkNoActivity_CreatesFlag() {
        Optional<ReviewFlag> flagOpt = unusualActivityDetectionService.checkNoActivity(sprint, team, repository, 0);

        assertThat(flagOpt).isPresent();
        ReviewFlag flag = flagOpt.get();
        assertThat(flag.getType()).isEqualTo(ReviewFlag.ReviewFlagType.NO_ACTIVITY);
        assertThat(flag.getSeverity()).isEqualTo(ReviewFlag.ReviewFlagSeverity.LOW);
        assertThat(flag.getDescription()).contains("no commit activity recorded");
    }

    @Test
    @DisplayName("Commit occurring after checkpoint creates POST_CHECKPOINT_ACTIVITY review flag")
    void checkPostCheckpointActivity_CreatesFlag() {
        Checkpoint cp = Checkpoint.builder()
                .sprint(sprint)
                .team(team)
                .repository(repository)
                .commitSha("checkpoint-head-sha")
                .commitCount(5)
                .status("CREATED")
                .build();

        CommitEntity commit = CommitEntity.builder()
                .githubCommitSha("post-freeze-commit-123")
                .repository(repository)
                .team(team)
                .authorUsername("legitimate-dev")
                .committedAt(LocalDateTime.now())
                .changedFiles(2)
                .additions(20)
                .deletions(5)
                .build();
        commitRepository.save(commit);

        Optional<ReviewFlag> flagOpt = unusualActivityDetectionService.checkPostCheckpointActivity(
                team, repository, sprint, cp, commit
        );

        assertThat(flagOpt).isPresent();
        ReviewFlag flag = flagOpt.get();
        assertThat(flag.getType()).isEqualTo(ReviewFlag.ReviewFlagType.POST_CHECKPOINT_ACTIVITY);
        assertThat(flag.getSeverity()).isEqualTo(ReviewFlag.ReviewFlagSeverity.MEDIUM);
        assertThat(flag.getTitle()).contains("Post-Checkpoint Activity");
        assertThat(flag.getDescription()).contains("submitted after Sprint");
    }
}
