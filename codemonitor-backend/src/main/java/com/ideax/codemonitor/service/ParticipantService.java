package com.ideax.codemonitor.service;

import com.ideax.codemonitor.dto.CreateParticipantRequest;
import com.ideax.codemonitor.dto.ParticipantResponse;
import com.ideax.codemonitor.dto.ParticipantSyncResponse;
import com.ideax.codemonitor.dto.UpdateParticipantRequest;
import com.ideax.codemonitor.entity.AuditLog;
import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.entity.Participant;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.exception.ApiException;
import com.ideax.codemonitor.exception.DuplicateResourceException;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.GithubProperties;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import com.ideax.codemonitor.github.dto.GithubTeamDto;
import com.ideax.codemonitor.github.dto.GithubUserDto;
import com.ideax.codemonitor.repository.CommitRepository;
import com.ideax.codemonitor.repository.GitRepositoryRepository;
import com.ideax.codemonitor.repository.ParticipantRepository;
import com.ideax.codemonitor.repository.TeamRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ParticipantService {

    private static final Logger log = LoggerFactory.getLogger(ParticipantService.class);

    public static final Set<String> IGNORED_USERNAMES = Set.of(
            "ideax-mbmc",
            "hyouka72",
            "gaurabpandey798"
    );

    public static boolean isIgnoredUsername(String username) {
        return username != null && IGNORED_USERNAMES.contains(username.trim().toLowerCase());
    }

    private final ParticipantRepository participantRepository;
    private final TeamRepository teamRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final CommitRepository commitRepository;
    private final AuditLogService auditLogService;
    private final GithubClient githubClient;
    private final GithubProperties githubProperties;

    @Autowired
    public ParticipantService(ParticipantRepository participantRepository,
                              TeamRepository teamRepository,
                              GitRepositoryRepository gitRepositoryRepository,
                              CommitRepository commitRepository,
                              AuditLogService auditLogService,
                              GithubClient githubClient,
                              GithubProperties githubProperties) {
        this.participantRepository = participantRepository;
        this.teamRepository = teamRepository;
        this.gitRepositoryRepository = gitRepositoryRepository;
        this.commitRepository = commitRepository;
        this.auditLogService = auditLogService;
        this.githubClient = githubClient;
        this.githubProperties = githubProperties;
    }

    public ParticipantService(ParticipantRepository participantRepository,
                              TeamRepository teamRepository,
                              CommitRepository commitRepository,
                              AuditLogService auditLogService,
                              GithubClient githubClient) {
        this(participantRepository, teamRepository, null, commitRepository, auditLogService, githubClient, null);
    }

    @Transactional(readOnly = true)
    public List<ParticipantResponse> listParticipants(Long teamId) {
        List<Participant> participants;
        if (teamId != null) {
            participants = participantRepository.findByTeamId(teamId);
        } else {
            participants = participantRepository.findAll();
        }
        return participants.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ParticipantResponse getParticipant(Long id) {
        Participant participant = participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", id));
        return toResponse(participant);
    }

    @Transactional
    public ParticipantResponse createParticipant(CreateParticipantRequest request, String actor) {
        if (request.getTeamId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TEAM_ID", "Team ID is required");
        }
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamId()));

        if (!StringUtils.hasText(request.getGithubUsername())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_GITHUB_USERNAME", "GitHub username is required");
        }

        String cleanUsername = request.getGithubUsername().trim();

        // Enforce unique GitHub username across all teams
        Optional<Participant> existing = participantRepository.findByGithubUsernameIgnoreCase(cleanUsername);
        if (existing.isPresent()) {
            Participant p = existing.get();
            if (p.getTeam().getId().equals(team.getId())) {
                throw new DuplicateResourceException(
                        String.format("Participant with GitHub username '%s' is already registered in Team %02d (%s)",
                                cleanUsername, team.getTeamNumber(), team.getTeamName())
                );
            } else {
                throw new DuplicateResourceException(
                        String.format("GitHub username '%s' is already registered in Team %02d (%s). A GitHub account cannot belong to multiple teams.",
                                cleanUsername, p.getTeam().getTeamNumber(), p.getTeam().getTeamName())
                );
            }
        }

        String displayName = StringUtils.hasText(request.getDisplayName()) ? request.getDisplayName().trim() : cleanUsername;
        String role = StringUtils.hasText(request.getRole()) ? request.getRole().trim() : "MEMBER";

        Long ghUserId = request.getGithubUserId();
        if (ghUserId == null) {
            try {
                ghUserId = githubClient.getUserIdByUsername(cleanUsername).orElse(null);
            } catch (Exception ex) {
                log.debug("GitHub user lookup failed for {}: {}", cleanUsername, ex.getMessage());
            }
        }

        Participant participant = Participant.builder()
                .team(team)
                .githubUsername(cleanUsername)
                .displayName(displayName)
                .githubUserId(ghUserId)
                .role(role)
                .status("REGISTERED")
                .build();

        Participant saved = participantRepository.save(participant);

        // Retroactively link existing commits authored by this user on this team
        commitRepository.linkParticipantToExistingCommits(team.getId(), cleanUsername, saved);

        // Audit log
        auditLogService.logAction(
                AuditLog.AuditAction.PARTICIPANT_REGISTERED,
                actor != null ? actor : "admin",
                null,
                team.getId(),
                team.getRepositoryId(),
                null,
                String.format("Registered participant '%s' (%s) in Team %02d as %s", cleanUsername, displayName, team.getTeamNumber(), role),
                String.format("{\"participantId\":%d,\"username\":\"%s\",\"teamId\":%d,\"role\":\"%s\"}",
                        saved.getId(), cleanUsername, team.getId(), role)
        );

        return toResponse(saved);
    }

    @Transactional
    public ParticipantResponse updateParticipant(Long id, UpdateParticipantRequest request, String actor) {
        Participant participant = participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", id));

        // Update GitHub username if provided
        if (StringUtils.hasText(request.getGithubUsername())) {
            String newUsername = request.getGithubUsername().trim();
            if (!newUsername.equalsIgnoreCase(participant.getGithubUsername())) {
                Optional<Participant> existing = participantRepository.findByGithubUsernameIgnoreCase(newUsername);
                if (existing.isPresent() && !existing.get().getId().equals(id)) {
                    throw new DuplicateResourceException(
                            String.format("GitHub username '%s' is already registered to Team %02d (%s)",
                                    newUsername, existing.get().getTeam().getTeamNumber(), existing.get().getTeam().getTeamName())
                    );
                }
                participant.setGithubUsername(newUsername);
            }
        }

        if (request.getDisplayName() != null) {
            participant.setDisplayName(request.getDisplayName().trim());
        }

        if (StringUtils.hasText(request.getRole())) {
            participant.setRole(request.getRole().trim());
        }

        if (StringUtils.hasText(request.getStatus())) {
            participant.setStatus(request.getStatus().trim());
        }

        // Team reassignment validation
        if (request.getTeamId() != null && !request.getTeamId().equals(participant.getTeam().getId())) {
            long existingCommits = commitRepository.countByParticipantId(id);
            if (existingCommits > 0) {
                throw new ApiException(HttpStatus.CONFLICT, "CANNOT_REASSIGN_ACTIVE_PARTICIPANT",
                        String.format("Cannot reassign Team for participant '%s' because %d historical commits are already associated with Team %02d.",
                                participant.getGithubUsername(), existingCommits, participant.getTeam().getTeamNumber()));
            }
            Team newTeam = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamId()));
            participant.setTeam(newTeam);
        }

        Participant saved = participantRepository.save(participant);

        auditLogService.logAction(
                AuditLog.AuditAction.PARTICIPANT_UPDATED,
                actor != null ? actor : "admin",
                null,
                saved.getTeam().getId(),
                saved.getTeam().getRepositoryId(),
                null,
                String.format("Updated participant '%s' (ID: %d) in Team %02d", saved.getGithubUsername(), saved.getId(), saved.getTeam().getTeamNumber()),
                String.format("{\"participantId\":%d,\"username\":\"%s\",\"teamId\":%d}",
                        saved.getId(), saved.getGithubUsername(), saved.getTeam().getId())
        );

        return toResponse(saved);
    }

    @Transactional
    public void deleteParticipant(Long id, String actor) {
        Participant participant = participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", id));

        Long teamId = participant.getTeam().getId();
        Integer teamNumber = participant.getTeam().getTeamNumber();
        Long repoId = participant.getTeam().getRepositoryId();
        String username = participant.getGithubUsername();

        // 1. Detach participant reference from all commits to preserve historical commit records
        commitRepository.detachParticipant(id);

        // 2. Remove participant record
        participantRepository.delete(participant);

        // 3. Audit log
        auditLogService.logAction(
                AuditLog.AuditAction.PARTICIPANT_REMOVED,
                actor != null ? actor : "admin",
                null,
                teamId,
                repoId,
                null,
                String.format("Removed official participant '%s' (ID: %d) from Team %02d. Historical commit records preserved.", username, id, teamNumber),
                String.format("{\"participantId\":%d,\"username\":\"%s\",\"teamId\":%d}", id, username, teamId)
        );
    }

    @Transactional
    public ParticipantSyncResponse syncParticipantsFromGithub(Long targetTeamId, String actor) {
        String org = (githubProperties != null && StringUtils.hasText(githubProperties.getOrganization()))
                ? githubProperties.getOrganization()
                : "MBMC-IdeaX";

        log.info("Starting participants sync from GitHub organization: {}", org);
        List<GithubTeamDto> ghTeams = githubClient.listTeams(org);

        List<Team> teamsToSync;
        if (targetTeamId != null) {
            Team target = teamRepository.findById(targetTeamId)
                    .orElseThrow(() -> new ResourceNotFoundException("Team", targetTeamId));
            teamsToSync = List.of(target);
        } else {
            teamsToSync = teamRepository.findAll();
        }

        int teamsMatched = 0;
        int participantsSynced = 0;
        int newParticipantsAdded = 0;
        List<ParticipantResponse> syncedParticipants = new ArrayList<>();
        List<String> messages = new ArrayList<>();
        java.util.Map<String, List<GithubRepoDto>> teamReposCache = new java.util.HashMap<>();

        for (Team team : teamsToSync) {
            GithubTeamDto matchedGhTeam = null;

            // Strategy 1: Check by stored githubTeamSlug or githubTeamId
            final String teamSlug = team.getGithubTeamSlug();
            if (StringUtils.hasText(teamSlug)) {
                matchedGhTeam = ghTeams.stream()
                        .filter(t -> t.getSlug().equalsIgnoreCase(teamSlug))
                        .findFirst()
                        .orElse(null);
            }

            // Strategy 2: Check by team repository matching
            if (matchedGhTeam == null && gitRepositoryRepository != null) {
                GitRepository repo = null;
                if (team.getRepositoryId() != null) {
                    repo = gitRepositoryRepository.findById(team.getRepositoryId()).orElse(null);
                }
                if (repo == null) {
                    repo = gitRepositoryRepository.findByTeamId(team.getId()).orElse(null);
                }

                if (repo != null) {
                    String repoName = repo.getName();
                    String repoFullName = repo.getFullName();
                    Long repoGhId = repo.getGithubRepositoryId();
                    for (GithubTeamDto ghTeam : ghTeams) {
                        if ("oc-members".equalsIgnoreCase(ghTeam.getSlug())) continue;
                        List<GithubRepoDto> teamRepos = teamReposCache.computeIfAbsent(
                                ghTeam.getSlug(),
                                slug -> githubClient.listTeamRepositories(org, slug)
                        );
                        boolean hasRepo = teamRepos.stream().anyMatch(tr ->
                                (tr.getName() != null && tr.getName().equalsIgnoreCase(repoName)) ||
                                (tr.getFullName() != null && tr.getFullName().equalsIgnoreCase(repoFullName)) ||
                                (tr.getId() != null && tr.getId().equals(repoGhId))
                        );
                        if (hasRepo) {
                            matchedGhTeam = ghTeam;
                            break;
                        }
                    }
                }
            }

            // Strategy 3: Check by normalized team name / slug
            if (matchedGhTeam == null) {
                String normalizedTeamName = normalizeName(team.getTeamName());
                matchedGhTeam = ghTeams.stream()
                        .filter(t -> !"oc-members".equalsIgnoreCase(t.getSlug()))
                        .filter(t -> normalizeName(t.getName()).equals(normalizedTeamName) ||
                                     normalizeName(t.getSlug()).equals(normalizedTeamName))
                        .findFirst()
                        .orElse(null);
            }

            if (matchedGhTeam == null) {
                messages.add(String.format("No GitHub team found for Team %02d (%s)", team.getTeamNumber(), team.getTeamName()));
                continue;
            }

            teamsMatched++;

            // Update team with githubTeamId and githubTeamSlug if not already set
            boolean teamUpdated = false;
            if (team.getGithubTeamId() == null || !team.getGithubTeamId().equals(matchedGhTeam.getId())) {
                team.setGithubTeamId(matchedGhTeam.getId());
                teamUpdated = true;
            }
            if (team.getGithubTeamSlug() == null || !team.getGithubTeamSlug().equalsIgnoreCase(matchedGhTeam.getSlug())) {
                team.setGithubTeamSlug(matchedGhTeam.getSlug());
                teamUpdated = true;
            }
            if (teamUpdated) {
                team = teamRepository.saveAndFlush(team);
            }

            // Fetch team members from GitHub
            List<GithubUserDto> members = githubClient.listTeamMembers(org, matchedGhTeam.getSlug());
            for (GithubUserDto member : members) {
                if (member.getLogin() == null) continue;
                String cleanUsername = member.getLogin().trim();

                if (IGNORED_USERNAMES.contains(cleanUsername.toLowerCase())) {
                    continue; // Skip org admins and organizers
                }

                Optional<Participant> existingOpt = participantRepository.findByGithubUsernameIgnoreCase(cleanUsername);
                if (existingOpt.isPresent()) {
                    Participant existing = existingOpt.get();
                    if (existing.getTeam().getId().equals(team.getId())) {
                        if (existing.getGithubUserId() == null && member.getId() != null) {
                            existing.setGithubUserId(member.getId());
                            participantRepository.save(existing);
                        }
                        participantsSynced++;
                        syncedParticipants.add(toResponse(existing));
                    } else {
                        messages.add(String.format("User '%s' is in GitHub team '%s' but registered to Team %02d in DB",
                                cleanUsername, matchedGhTeam.getName(), existing.getTeam().getTeamNumber()));
                    }
                } else {
                    // Fetch full user details for name if available
                    String displayName = cleanUsername;
                    try {
                        Optional<GithubUserDto> userDetails = githubClient.getUser(cleanUsername);
                        if (userDetails.isPresent() && StringUtils.hasText(userDetails.get().getName())) {
                            displayName = userDetails.get().getName().trim();
                        }
                    } catch (Exception ignored) {}

                    Participant newParticipant = Participant.builder()
                            .team(team)
                            .githubUsername(cleanUsername)
                            .displayName(displayName)
                            .githubUserId(member.getId())
                            .role("MEMBER")
                            .status("REGISTERED")
                            .build();

                    Participant saved = participantRepository.save(newParticipant);
                    commitRepository.linkParticipantToExistingCommits(team.getId(), cleanUsername, saved);

                    auditLogService.logAction(
                            AuditLog.AuditAction.PARTICIPANT_REGISTERED,
                            actor != null ? actor : "admin",
                            null,
                            team.getId(),
                            team.getRepositoryId(),
                            null,
                            String.format("Synced participant '%s' (%s) from GitHub team '%s' into Team %02d",
                                    cleanUsername, displayName, matchedGhTeam.getName(), team.getTeamNumber()),
                            String.format("{\"participantId\":%d,\"username\":\"%s\",\"teamId\":%d,\"source\":\"GITHUB_SYNC\"}",
                                    saved.getId(), cleanUsername, team.getId())
                    );

                    participantsSynced++;
                    newParticipantsAdded++;
                    syncedParticipants.add(toResponse(saved));
                }
            }
        }

        // Check recent direct repository collaborator additions (e.g. MemberEvent 'added')
        try {
            String authUser = githubClient.getAuthenticatedUsername().orElse(null);
            if (StringUtils.hasText(authUser)) {
                List<JsonNode> events = githubClient.listUserOrgEvents(authUser, org);
                for (JsonNode event : events) {
                    if ("MemberEvent".equalsIgnoreCase(event.path("type").asText())
                            && "added".equalsIgnoreCase(event.path("payload").path("action").asText())) {
                        String memberLogin = event.path("payload").path("member").path("login").asText();
                        Long memberId = event.path("payload").path("member").has("id")
                                ? event.path("payload").path("member").path("id").asLong() : null;
                        String repoFullName = event.path("repo").path("name").asText(); // "MBMC-IdeaX/Pomelo"
                        String repoName = repoFullName;
                        if (repoName.contains("/")) {
                            repoName = repoName.substring(repoName.lastIndexOf('/') + 1);
                        }

                        if (!StringUtils.hasText(memberLogin) || isIgnoredUsername(memberLogin)) {
                            continue;
                        }

                        // Match to repository & team
                        final String finalRepoName = repoName;
                        Optional<GitRepository> repoOpt = gitRepositoryRepository.findByNameIgnoreCase(finalRepoName);
                        if (repoOpt.isEmpty()) {
                            repoOpt = gitRepositoryRepository.findByFullNameIgnoreCase("MBMC-IdeaX/" + finalRepoName);
                        }

                        if (repoOpt.isPresent() && repoOpt.get().getTeam() != null) {
                            Team directTeam = repoOpt.get().getTeam();
                            if (targetTeamId != null && !directTeam.getId().equals(targetTeamId)) {
                                continue;
                            }

                            Optional<Participant> existing = participantRepository.findByGithubUsernameIgnoreCase(memberLogin);
                            if (existing.isEmpty()) {
                                String displayName = memberLogin;
                                try {
                                    Optional<GithubUserDto> ud = githubClient.getUser(memberLogin);
                                    if (ud.isPresent() && StringUtils.hasText(ud.get().getName())) {
                                        displayName = ud.get().getName().trim();
                                    }
                                } catch (Exception ignored) {}

                                Participant newParticipant = Participant.builder()
                                        .team(directTeam)
                                        .githubUsername(memberLogin)
                                        .displayName(displayName)
                                        .githubUserId(memberId)
                                        .role("MEMBER")
                                        .status("REGISTERED")
                                        .build();

                                Participant saved = participantRepository.save(newParticipant);
                                commitRepository.linkParticipantToExistingCommits(directTeam.getId(), memberLogin, saved);

                                auditLogService.logAction(
                                        AuditLog.AuditAction.PARTICIPANT_REGISTERED,
                                        actor != null ? actor : "admin",
                                        null,
                                        directTeam.getId(),
                                        repoOpt.get().getId(),
                                        null,
                                        String.format("Synced direct repository collaborator '%s' (%s) into Team %02d (%s)",
                                                memberLogin, displayName, directTeam.getTeamNumber(), directTeam.getTeamName()),
                                        String.format("{\"participantId\":%d,\"username\":\"%s\",\"teamId\":%d,\"source\":\"DIRECT_REPO_COLLABORATOR\"}",
                                                saved.getId(), memberLogin, directTeam.getId())
                                );

                                participantsSynced++;
                                newParticipantsAdded++;
                                syncedParticipants.add(toResponse(saved));
                                messages.add(String.format("Enrolled direct collaborator '%s' into Team %02d (%s)",
                                        memberLogin, directTeam.getTeamNumber(), directTeam.getTeamName()));
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Failed checking direct repo member events: {}", ex.getMessage());
        }

        // Identify unassigned organization members
        List<GithubUserDto> unassignedMembers = new ArrayList<>();
        try {
            List<GithubUserDto> orgMembers = githubClient.listOrgMembers(org);
            List<Participant> allParticipants = participantRepository.findAll();
            Set<String> registeredUsernames = allParticipants.stream()
                    .map(p -> p.getGithubUsername().toLowerCase())
                    .collect(Collectors.toSet());

            for (GithubUserDto om : orgMembers) {
                if (om.getLogin() != null
                        && !isIgnoredUsername(om.getLogin())
                        && !registeredUsernames.contains(om.getLogin().toLowerCase())) {
                    unassignedMembers.add(om);
                }
            }

            if (!unassignedMembers.isEmpty()) {
                String names = unassignedMembers.stream().map(GithubUserDto::getLogin).collect(Collectors.joining(", "));
                messages.add(String.format("Found %d unassigned organization member(s): %s", unassignedMembers.size(), names));
            }
        } catch (Exception ex) {
            log.warn("Failed checking unassigned org members: {}", ex.getMessage());
        }

        messages.add(String.format("Sync completed: %d teams matched, %d participants synced (%d newly added).",
                teamsMatched, participantsSynced, newParticipantsAdded));

        return ParticipantSyncResponse.builder()
                .totalTeamsChecked(teamsToSync.size())
                .teamsMatched(teamsMatched)
                .participantsSynced(participantsSynced)
                .newParticipantsAdded(newParticipantsAdded)
                .participants(syncedParticipants)
                .unassignedOrgMembers(unassignedMembers)
                .messages(messages)
                .build();
    }

    @Transactional(readOnly = true)
    public List<GithubUserDto> getUnassignedOrgMembers() {
        String org = (githubProperties != null && StringUtils.hasText(githubProperties.getOrganization()))
                ? githubProperties.getOrganization()
                : "MBMC-IdeaX";

        List<GithubUserDto> orgMembers = githubClient.listOrgMembers(org);
        List<Participant> allParticipants = participantRepository.findAll();
        Set<String> registeredUsernames = allParticipants.stream()
                .map(p -> p.getGithubUsername().toLowerCase())
                .collect(Collectors.toSet());

        return orgMembers.stream()
                .filter(m -> m.getLogin() != null
                        && !isIgnoredUsername(m.getLogin())
                        && !registeredUsernames.contains(m.getLogin().toLowerCase()))
                .collect(Collectors.toList());
    }

    private static String normalizeName(String input) {
        if (input == null) return "";
        return input.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private ParticipantResponse toResponse(Participant p) {
        long commits = commitRepository.countByParticipantId(p.getId());
        return ParticipantResponse.builder()
                .id(p.getId())
                .teamId(p.getTeam().getId())
                .teamNumber(p.getTeam().getTeamNumber())
                .teamName(p.getTeam().getTeamName())
                .githubUserId(p.getGithubUserId())
                .githubUsername(p.getGithubUsername())
                .displayName(p.getDisplayName())
                .role(p.getRole())
                .status(p.getStatus())
                .commitCount(commits)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
