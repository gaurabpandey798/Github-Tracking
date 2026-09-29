package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.EventReportResponse;
import com.ideax.codemonitor.dto.SprintReportResponse;
import com.ideax.codemonitor.dto.TeamReportResponse;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReportService {

    private final EventStateRepository eventStateRepository;
    private final TeamRepository teamRepository;
    private final ParticipantRepository participantRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final SprintRepository sprintRepository;
    private final CheckpointRepository checkpointRepository;
    private final CommitRepository commitRepository;
    private final ReviewFlagRepository reviewFlagRepository;

    public ReportService(EventStateRepository eventStateRepository,
                         TeamRepository teamRepository,
                         ParticipantRepository participantRepository,
                         GitRepositoryRepository gitRepositoryRepository,
                         SprintRepository sprintRepository,
                         CheckpointRepository checkpointRepository,
                         CommitRepository commitRepository,
                         ReviewFlagRepository reviewFlagRepository) {
        this.eventStateRepository = eventStateRepository;
        this.teamRepository = teamRepository;
        this.participantRepository = participantRepository;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.sprintRepository = sprintRepository;
        this.checkpointRepository = checkpointRepository;
        this.commitRepository = commitRepository;
        this.reviewFlagRepository = reviewFlagRepository;
    }

    @Transactional(readOnly = true)
    public EventReportResponse getEventReport() {
        EventState state = eventStateRepository.getGlobalEventState()
                .orElseGet(() -> EventState.builder().status(EventState.EventStatus.NOT_STARTED).build());

        long totalTeams = teamRepository.count();
        long totalParticipants = participantRepository.count();
        long totalRepos = gitRepositoryRepository.count();
        long totalCommits = commitRepository.count();
        long totalFlags = reviewFlagRepository.count();
        long openFlags = reviewFlagRepository.countByStatus(ReviewFlag.ReviewFlagStatus.OPEN);
        long totalCheckpoints = checkpointRepository.count();

        // Calculate unique contributors across all commits
        long distinctContributors = commitRepository.findAll().stream()
                .map(CommitEntity::getAuthorUsername)
                .distinct()
                .count();

        List<Sprint> sprints = sprintRepository.findAllByOrderBySprintNumberAsc();
        List<EventReportResponse.SprintSummaryDto> sprintSummaries = new ArrayList<>();
        for (Sprint s : sprints) {
            int cpCount = checkpointRepository.findBySprintId(s.getId()).size();
            sprintSummaries.add(EventReportResponse.SprintSummaryDto.builder()
                    .sprintNumber(s.getSprintNumber())
                    .name(s.getName())
                    .status(s.getStatus().name())
                    .checkpointsCount(cpCount)
                    .build());
        }

        double expectedCheckpoints = totalTeams * 8.0;
        double completionRate = expectedCheckpoints > 0 ? (totalCheckpoints / expectedCheckpoints) * 100.0 : 0.0;

        return EventReportResponse.builder()
                .eventStatus(state.getStatus().name())
                .currentSprintNumber(state.getCurrentSprintNumber())
                .totalTeams(totalTeams)
                .totalParticipants(totalParticipants)
                .totalRepositories(totalRepos)
                .totalCommits(totalCommits)
                .totalContributors(distinctContributors)
                .totalReviewFlags(totalFlags)
                .openReviewFlags(openFlags)
                .totalCheckpointsCreated(totalCheckpoints)
                .checkpointCompletionPercentage(Math.round(completionRate * 10.0) / 10.0)
                .sprints(sprintSummaries)
                .build();
    }

    @Transactional(readOnly = true)
    public TeamReportResponse getTeamReport(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", teamId));

        GitRepository repo = team.getRepository();
        if (repo == null && team.getRepositoryId() != null) {
            repo = gitRepositoryRepository.findById(team.getRepositoryId()).orElse(null);
        }

        TeamReportResponse.RepositorySummaryDto repoDto = null;
        if (repo != null) {
            repoDto = TeamReportResponse.RepositorySummaryDto.builder()
                    .id(repo.getId())
                    .fullName(repo.getFullName())
                    .url(repo.getUrl())
                    .defaultBranch(repo.getDefaultBranch())
                    .isArchived(repo.isArchived())
                    .build();
        }

        List<Participant> participants = participantRepository.findByTeamId(team.getId());
        List<TeamReportResponse.ParticipantSummaryDto> participantDtos = participants.stream().map(p ->
                TeamReportResponse.ParticipantSummaryDto.builder()
                        .id(p.getId())
                        .githubUsername(p.getGithubUsername())
                        .githubUserId(p.getGithubUserId())
                        .displayName(p.getDisplayName())
                        .role(p.getRole())
                        .status(p.getStatus())
                        .build()
        ).toList();

        List<CommitEntity> teamCommits = commitRepository.findByTeamIdOrderByCommittedAtDesc(team.getId());
        long uniqueAuthors = teamCommits.stream().map(CommitEntity::getAuthorUsername).distinct().count();
        int totalFilesChanged = teamCommits.stream().mapToInt(CommitEntity::getChangedFiles).sum();
        int totalAdditions = teamCommits.stream().mapToInt(CommitEntity::getAdditions).sum();
        int totalDeletions = teamCommits.stream().mapToInt(CommitEntity::getDeletions).sum();

        List<Checkpoint> checkpoints = checkpointRepository.findByTeamIdOrderByCreatedAtAsc(team.getId());
        List<TeamReportResponse.CheckpointHistoryDto> cpHistory = checkpoints.stream().map(cp ->
                TeamReportResponse.CheckpointHistoryDto.builder()
                        .sprintNumber(cp.getSprint().getSprintNumber())
                        .commitSha(cp.getCommitSha())
                        .commitCount(cp.getCommitCount())
                        .filesChanged(cp.getFilesChanged())
                        .additions(cp.getAdditions())
                        .deletions(cp.getDeletions())
                        .createdAt(cp.getCreatedAt())
                        .build()
        ).toList();

        List<ReviewFlag> flags = reviewFlagRepository.findByTeamId(team.getId());
        List<TeamReportResponse.ReviewFlagSummaryDto> flagDtos = flags.stream().map(f ->
                TeamReportResponse.ReviewFlagSummaryDto.builder()
                        .id(f.getId())
                        .type(f.getType())
                        .severity(f.getSeverity())
                        .title(f.getTitle())
                        .description(f.getDescription())
                        .status(f.getStatus())
                        .createdAt(f.getCreatedAt())
                        .build()
        ).toList();

        // Commits by sprint
        List<TeamReportResponse.SprintCommitStatDto> sprintStats = new ArrayList<>();
        List<Sprint> sprints = sprintRepository.findAllByOrderBySprintNumberAsc();
        for (Sprint s : sprints) {
            if (s.getReleasedAt() != null) {
                var sprintCommits = commitRepository.findByTeamIdSince(team.getId(), s.getReleasedAt());
                int count = sprintCommits.size();
                int adds = sprintCommits.stream().mapToInt(CommitEntity::getAdditions).sum();
                int dels = sprintCommits.stream().mapToInt(CommitEntity::getDeletions).sum();

                sprintStats.add(TeamReportResponse.SprintCommitStatDto.builder()
                        .sprintNumber(s.getSprintNumber())
                        .sprintName(s.getName())
                        .commitCount(count)
                        .additions(adds)
                        .deletions(dels)
                        .build());
            }
        }

        return TeamReportResponse.builder()
                .teamId(team.getId())
                .teamNumber(team.getTeamNumber())
                .teamName(team.getTeamName())
                .teamStatus(team.getStatus())
                .repository(repoDto)
                .participants(participantDtos)
                .totalCommits(teamCommits.size())
                .uniqueContributors(uniqueAuthors)
                .totalFilesChanged(totalFilesChanged)
                .totalAdditions(totalAdditions)
                .totalDeletions(totalDeletions)
                .commitsBySprint(sprintStats)
                .checkpointHistory(cpHistory)
                .reviewFlags(flagDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public SprintReportResponse getSprintReport(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", sprintId));

        List<Checkpoint> checkpoints = checkpointRepository.findBySprintId(sprint.getId());
        long totalTeams = teamRepository.count();

        int totalCommits = checkpoints.stream().mapToInt(Checkpoint::getCommitCount).sum();
        int totalAdditions = checkpoints.stream().mapToInt(Checkpoint::getAdditions).sum();
        int totalDeletions = checkpoints.stream().mapToInt(Checkpoint::getDeletions).sum();

        List<ReviewFlag> flags = reviewFlagRepository.findBySprintId(sprint.getId());

        List<SprintReportResponse.TeamSprintCheckpointDto> teamCpDtos = checkpoints.stream().map(cp ->
                SprintReportResponse.TeamSprintCheckpointDto.builder()
                        .teamNumber(cp.getTeam().getTeamNumber())
                        .teamName(cp.getTeam().getTeamName())
                        .repositoryName(cp.getRepository().getFullName())
                        .commitSha(cp.getCommitSha())
                        .commitCount(cp.getCommitCount())
                        .developerCount(cp.getDeveloperCount())
                        .additions(cp.getAdditions())
                        .deletions(cp.getDeletions())
                        .filesChanged(cp.getFilesChanged())
                        .lastActivityAt(cp.getLastActivityAt())
                        .status(cp.getStatus())
                        .build()
        ).toList();

        return SprintReportResponse.builder()
                .sprintNumber(sprint.getSprintNumber())
                .sprintName(sprint.getName())
                .status(sprint.getStatus().name())
                .releasedAt(sprint.getReleasedAt())
                .frozenAt(sprint.getFrozenAt())
                .teamCompletionCount(checkpoints.size())
                .totalTeams((int) totalTeams)
                .totalCommits(totalCommits)
                .totalAdditions(totalAdditions)
                .totalDeletions(totalDeletions)
                .flagsCount(flags.size())
                .checkpoints(teamCpDtos)
                .build();
    }
}
