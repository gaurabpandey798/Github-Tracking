package com.ideax.codemonitor.github;

import com.ideax.codemonitor.exception.GitHubApiException;
import com.ideax.codemonitor.exception.ResourceNotFoundException;
import com.ideax.codemonitor.github.dto.GithubBranchDto;
import com.ideax.codemonitor.github.dto.GithubCommitDto;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class GithubClient {

    private static final Logger log = LoggerFactory.getLogger(GithubClient.class);

    private final RestClient restClient;
    private final GithubProperties properties;
    private final ObjectMapper objectMapper;

    @Autowired
    public GithubClient(GithubProperties properties, RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(30));

        RestClient.Builder builder = restClientBuilder
                .requestFactory(requestFactory)
                .baseUrl(properties.getApi().getBaseUrl())
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", properties.getApi().getVersion())
                .defaultHeader("User-Agent", "IdeaX-CodeMonitor/1.0");

        if (StringUtils.hasText(properties.getToken())) {
            builder.defaultHeader("Authorization", "Bearer " + properties.getToken().trim());
        }

        this.restClient = builder.build();
    }

    // Constructor for testing with custom/mocked RestClient
    public GithubClient(GithubProperties properties, RestClient restClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    public Optional<GithubRepoDto> getRepository(String owner, String repo) {
        try {
            log.info("Fetching GitHub repository: {}/{}", owner, repo);
            GithubRepoDto response = restClient.get()
                    .uri("/repos/{owner}/{repo}", owner, repo)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, (req, resp) -> {
                        throw new HttpClientErrorException(HttpStatusCode.valueOf(404), "Repository not found");
                    })
                    .body(GithubRepoDto.class);
            return Optional.ofNullable(response);
        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("GitHub repository not found: {}/{}", owner, repo);
            return Optional.empty();
        } catch (HttpClientErrorException ex) {
            log.error("GitHub client error fetching repo {}/{}: HTTP {}", owner, repo, ex.getStatusCode());
            throw new GitHubApiException("Failed to fetch GitHub repository " + owner + "/" + repo + ": " + ex.getMessage(), ex);
        } catch (HttpServerErrorException ex) {
            log.error("GitHub server error fetching repo {}/{}: HTTP {}", owner, repo, ex.getStatusCode());
            throw new GitHubApiException("GitHub server error while fetching " + owner + "/" + repo, ex);
        } catch (Exception ex) {
            log.error("Unexpected error fetching repo {}/{}: {}", owner, repo, ex.getMessage());
            throw new GitHubApiException("Failed to communicate with GitHub API: " + ex.getMessage(), ex);
        }
    }

    public GithubRepoDto updateRepositoryArchived(String owner, String repo, boolean archived) {
        try {
            log.info("Updating GitHub repository archived state: {}/{} -> archived={}", owner, repo, archived);
            return restClient.patch()
                    .uri("/repos/{owner}/{repo}", owner, repo)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("archived", archived))
                    .retrieve()
                    .body(GithubRepoDto.class);
        } catch (HttpClientErrorException.Forbidden ex) {
            log.error("GitHub permission denied modifying archived state for {}/{}", owner, repo);
            throw new GitHubApiException("GitHub permission denied: PAT lacks admin rights to archive/unarchive " + owner + "/" + repo, ex);
        } catch (HttpClientErrorException.NotFound ex) {
            log.error("GitHub repository not found or unauthorized for {}/{}", owner, repo);
            throw new GitHubApiException("GitHub repository not found or token lacks access to update " + owner + "/" + repo, ex);
        } catch (RestClientResponseException ex) {
            log.error("GitHub error modifying archived state for {}/{}: HTTP {} - {}", owner, repo, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new GitHubApiException("GitHub API error (" + ex.getStatusCode() + "): " + ex.getResponseBodyAsString(), ex);
        } catch (Exception ex) {
            log.error("Failed to update repository archived state for {}/{}: {}", owner, repo, ex.getMessage());
            throw new GitHubApiException("Failed to update repository archived status for " + owner + "/" + repo + ": " + ex.getMessage(), ex);
        }
    }

    public Optional<GithubBranchDto> getBranch(String owner, String repo, String branch) {
        try {
            log.info("Fetching branch {} for {}/{}", branch, owner, repo);
            GithubBranchDto branchDto = restClient.get()
                    .uri("/repos/{owner}/{repo}/branches/{branch}", owner, repo, branch)
                    .retrieve()
                    .body(GithubBranchDto.class);
            return Optional.ofNullable(branchDto);
        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("Branch {} not found in {}/{}", branch, owner, repo);
            return Optional.empty();
        } catch (Exception ex) {
            log.error("Error fetching branch {} in {}/{}: {}", branch, owner, repo, ex.getMessage());
            throw new GitHubApiException("Failed to fetch branch " + branch + " for " + owner + "/" + repo, ex);
        }
    }

    public List<GithubCommitDto> listCommits(String owner, String repo, String sha, String since) {
        try {
            log.info("Listing commits for {}/{} (sha={}, since={})", owner, repo, sha, since);
            ResponseEntity<String> response = restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/repos/{owner}/{repo}/commits")
                                .queryParam("per_page", 100);
                        if (StringUtils.hasText(sha)) {
                            uriBuilder.queryParam("sha", sha);
                        }
                        if (StringUtils.hasText(since)) {
                            uriBuilder.queryParam("since", since);
                        }
                        return uriBuilder.build(owner, repo);
                    })
                    .retrieve()
                    .onStatus(status -> status.value() == 409, (req, resp) -> {
                        log.info("Repository {}/{} is empty (HTTP 409)", owner, repo);
                    })
                    .toEntity(String.class);

            if (response.getStatusCode().value() == 409) {
                log.info("Repository {}/{} is empty (Git 409 Conflict)", owner, repo);
                return Collections.emptyList();
            }

            String body = response.getBody();
            if (body == null || body.isBlank() || body.trim().startsWith("{")) {
                log.info("Repository {}/{} returned empty or non-array commit response: {}", owner, repo, body);
                return Collections.emptyList();
            }

            return objectMapper.readValue(body, new TypeReference<List<GithubCommitDto>>() {});
        } catch (HttpClientErrorException.Conflict ex) {
            log.info("Repository {}/{} is empty (Git 409 Conflict)", owner, repo);
            return Collections.emptyList();
        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("Commits not found for {}/{}", owner, repo);
            return Collections.emptyList();
        } catch (Exception ex) {
            log.error("Error fetching commits for {}/{}: {}", owner, repo, ex.getMessage());
            throw new GitHubApiException("Failed to fetch commits for " + owner + "/" + repo + ": " + ex.getMessage(), ex);
        }
    }

    public Optional<GithubCommitDto> getCommit(String owner, String repo, String sha) {
        try {
            log.info("Fetching commit {} for {}/{}", sha, owner, repo);
            GithubCommitDto commit = restClient.get()
                    .uri("/repos/{owner}/{repo}/commits/{sha}", owner, repo, sha)
                    .retrieve()
                    .body(GithubCommitDto.class);
            return Optional.ofNullable(commit);
        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("Commit {} not found for {}/{}", sha, owner, repo);
            return Optional.empty();
        } catch (Exception ex) {
            log.error("Error fetching commit {} for {}/{}: {}", sha, owner, repo, ex.getMessage());
            throw new GitHubApiException("Failed to fetch commit " + sha + " for " + owner + "/" + repo, ex);
        }
    }
}
