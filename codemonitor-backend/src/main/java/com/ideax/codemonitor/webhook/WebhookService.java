package com.ideax.codemonitor.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideax.codemonitor.entity.*;
import com.ideax.codemonitor.repository.*;
import com.ideax.codemonitor.service.AuditLogService;
import com.ideax.codemonitor.service.UnusualActivityDetectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    private final WebhookDeliveryRepository webhookDeliveryRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final TeamRepository teamRepository;
    private final CommitRepository commitRepository;
    private final CheckpointRepository checkpointRepository;
    private final ParticipantRepository participantRepository;
    private final SprintRepository sprintRepository;
    private final UnusualActivityDetectionService unusualActivityDetectionService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public WebhookService(WebhookDeliveryRepository webhookDeliveryRepository,
                          GitRepositoryRepository gitRepositoryRepository,
                          TeamRepository teamRepository,
                          CommitRepository commitRepository,
                          CheckpointRepository checkpointRepository,
                          ParticipantRepository participantRepository,
                          SprintRepository sprintRepository,
                          UnusualActivityDetectionService unusualActivityDetectionService,
                          AuditLogService auditLogService,
                          ObjectMapper objectMapper) {
        this.webhookDeliveryRepository = webhookDeliveryRepository;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.teamRepository = teamRepository;
        this.commitRepository = commitRepository;
        this.checkpointRepository = checkpointRepository;
        this.participantRepository = participantRepository;
        this.sprintRepository = sprintRepository;
        this.unusualActivityDetectionService = unusualActivityDetectionService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    public boolean isDeliveryAlreadyProcessed(String deliveryId) {
        if (deliveryId == null || deliveryId.isBlank()) {
            return false;
        }
        return webhookDeliveryRepository.existsByDeliveryId(deliveryId);
    }

    @Transactional
    public void recordDelivery(String deliveryId, String eventType) {
        if (deliveryId != null && !deliveryId.isBlank()) {
            WebhookDelivery delivery = WebhookDelivery.builder()
                    .deliveryId(deliveryId)
                    .eventType(eventType)
                    .build();
            webhookDeliveryRepository.save(delivery);
        }
    }

    @Transactional
    public void processPushEvent(String payloadJson) {
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            JsonNode repoNode = root.get("repository");
            if (repoNode == null) {
                log.warn("Push event payload missing repository node");
                return;
            }

            long githubRepoId = repoNode.get("id").asLong();
            String repoFullName = repoNode.get("full_name").asText();

            Optional<GitRepository> repoOpt = gitRepositoryRepository.findByGithubRepositoryId(githubRepoId);
            if (repoOpt.isEmpty()) {
                repoOpt = gitRepositoryRepository.findByFullNameIgnoreCase(repoFullName);
            }

            if (repoOpt.isEmpty()) {
                log.warn("Received push webhook for unmonitored repository: {}", repoFullName);
                return;
            }

            GitRepository repository = repoOpt.get();
            Team team = repository.getTeam();
            if (team == null && repository.getTeam() != null) {
                team = repository.getTeam();
            } else if (team == null) {
                team = teamRepository.findByRepositoryId(repository.getId()).orElse(null);
            }

            if (team == null) {
                log.warn("Repository {} is not associated with any team", repository.getFullName());
                return;
            }

            Sprint activeSprint = sprintRepository.findByStatus(Sprint.SprintStatus.ACTIVE).orElse(null);

            // Check force push
            boolean forced = root.has("forced") && root.get("forced").asBoolean();
            String ref = root.has("ref") ? root.get("ref").asText() : "main";
            String pusher = root.has("pusher") && root.get("pusher").has("name")
                    ? root.get("pusher").get("name").asText() : "unknown";
            String headCommitSha = root.has("after") ? root.get("after").asText() : null;

            if (forced) {
                log.warn("Force push detected on {} by {}!", repoFullName, pusher);
                unusualActivityDetectionService.checkForcePush(team, repository, activeSprint, headCommitSha, ref, pusher);
            }

            // Process commits array
            JsonNode commitsNode = root.get("commits");
            int savedCount = 0;

            if (commitsNode != null && commitsNode.isArray()) {
                for (JsonNode commitNode : commitsNode) {
                    String sha = commitNode.get("id").asText();
                    if (commitRepository.findByRepositoryIdAndGithubCommitSha(repository.getId(), sha).isPresent()) {
                        continue;
                    }

                    String authorUsername = "unknown";
                    if (commitNode.has("author") && commitNode.get("author").has("username")) {
                        authorUsername = commitNode.get("author").get("username").asText();
                    } else if (commitNode.has("author") && commitNode.get("author").has("name")) {
                        authorUsername = commitNode.get("author").get("name").asText();
                    }

                    String message = commitNode.has("message") ? commitNode.get("message").asText() : "";
                    String url = commitNode.has("url") ? commitNode.get("url").asText() : null;
                    String timestampStr = commitNode.has("timestamp") ? commitNode.get("timestamp").asText() : null;
                    LocalDateTime committedAt = parseDate(timestampStr);

                    int added = commitNode.has("added") ? commitNode.get("added").size() : 0;
                    int removed = commitNode.has("removed") ? commitNode.get("removed").size() : 0;
                    int modified = commitNode.has("modified") ? commitNode.get("modified").size() : 0;
                    int changedFiles = added + removed + modified;

                    Participant participant = participantRepository.findByTeamIdAndGithubUsernameIgnoreCase(
                            team.getId(), authorUsername
                    ).orElse(null);

                    CommitEntity commitEntity = CommitEntity.builder()
                            .githubCommitSha(sha)
                            .repository(repository)
                            .team(team)
                            .participant(participant)
                            .authorUsername(authorUsername)
                            .message(message)
                            .branch(ref)
                            .committedAt(committedAt)
                            .changedFiles(changedFiles)
                            .commitUrl(url)
                            .build();

                    CommitEntity saved = commitRepository.save(commitEntity);
                    savedCount++;

                    // Detection rules
                    unusualActivityDetectionService.checkLargeCommit(saved, activeSprint);
                    unusualActivityDetectionService.checkUnknownContributor(team, repository, activeSprint, sha, null, authorUsername);

                    // Track commits occurring after checkpoint SHA as post-checkpoint activity
                    Optional<Checkpoint> latestCpOpt = checkpointRepository.findTopByTeamIdOrderByCreatedAtDesc(team.getId());
                    if (latestCpOpt.isPresent()) {
                        Checkpoint cp = latestCpOpt.get();
                        boolean isPostCheckpoint = false;
                        if (cp.getSprint().getStatus() == Sprint.SprintStatus.FROZEN
                                && !saved.getGithubCommitSha().equals(cp.getCommitSha())) {
                            isPostCheckpoint = true;
                        } else if (activeSprint != null && cp.getSprint().getFrozenAt() != null
                                && saved.getCommittedAt() != null
                                && saved.getCommittedAt().isAfter(cp.getSprint().getFrozenAt())
                                && saved.getCommittedAt().isBefore(activeSprint.getReleasedAt())) {
                            isPostCheckpoint = true;
                        }

                        if (isPostCheckpoint) {
                            unusualActivityDetectionService.checkPostCheckpointActivity(
                                    team, repository, cp.getSprint(), cp, saved
                            );

                            auditLogService.logAction(
                                    AuditLog.AuditAction.COMMIT_RECEIVED,
                                    authorUsername,
                                    null,
                                    team.getId(),
                                    repository.getId(),
                                    cp.getSprint().getId(),
                                    String.format("Post-checkpoint activity: commit %s submitted after Sprint %d checkpoint (%s)",
                                            saved.getGithubCommitSha(), cp.getSprint().getSprintNumber(), cp.getCommitSha()),
                                    String.format("{\"postCheckpoint\":true,\"checkpointSha\":\"%s\",\"commitSha\":\"%s\",\"sprintNumber\":%d}",
                                            cp.getCommitSha(), saved.getGithubCommitSha(), cp.getSprint().getSprintNumber())
                            );
                        }
                    }
                }
            }

            if (savedCount > 0) {
                unusualActivityDetectionService.checkSuddenActivity(team, repository, activeSprint);
                auditLogService.logAction(
                        AuditLog.AuditAction.COMMIT_RECEIVED,
                        pusher,
                        null,
                        team.getId(),
                        repository.getId(),
                        activeSprint != null ? activeSprint.getId() : null,
                        String.format("Webhook: %d commits pushed to %s by %s", savedCount, repoFullName, pusher),
                        String.format("{\"commitsCount\":%d,\"ref\":\"%s\",\"head\":\"%s\"}", savedCount, ref, headCommitSha)
                );
            }
        } catch (Exception e) {
            log.error("Failed to parse push webhook payload", e);
        }
    }

    @Transactional
    public void processPullRequestEvent(String payloadJson) {
        try {
            JsonNode root = objectMapper.readTree(payloadJson);
            String action = root.has("action") ? root.get("action").asText() : "unknown";
            JsonNode prNode = root.get("pull_request");
            JsonNode repoNode = root.get("repository");

            if (prNode != null && repoNode != null) {
                String repoFullName = repoNode.get("full_name").asText();
                int prNumber = prNode.get("number").asInt();
                String title = prNode.get("title").asText();
                String user = prNode.has("user") && prNode.get("user").has("login")
                        ? prNode.get("user").get("login").asText() : "unknown";

                log.info("Pull Request webhook received: [{}] #{} '{}' by {} in {}", action, prNumber, title, user, repoFullName);

                gitRepositoryRepository.findByFullNameIgnoreCase(repoFullName).ifPresent(repo -> {
                    Team team = repo.getTeam();
                    Sprint activeSprint = sprintRepository.findByStatus(Sprint.SprintStatus.ACTIVE).orElse(null);

                    auditLogService.logAction(
                            AuditLog.AuditAction.COMMIT_RECEIVED,
                            user,
                            null,
                            team != null ? team.getId() : null,
                            repo.getId(),
                            activeSprint != null ? activeSprint.getId() : null,
                            String.format("PR #%d (%s): %s", prNumber, action, title),
                            String.format("{\"prNumber\":%d,\"action\":\"%s\",\"user\":\"%s\"}", prNumber, action, user)
                    );
                });
            }
        } catch (Exception e) {
            log.error("Failed to parse pull request webhook payload", e);
        }
    }

    private LocalDateTime parseDate(String isoString) {
        if (isoString == null || isoString.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return OffsetDateTime.parse(isoString, DateTimeFormatter.ISO_DATE_TIME)
                    .atZoneSameInstant(java.time.ZoneId.systemDefault())
                    .toLocalDateTime();
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}
