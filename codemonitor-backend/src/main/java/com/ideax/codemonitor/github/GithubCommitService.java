package com.ideax.codemonitor.github;

import com.ideax.codemonitor.github.dto.GithubCommitDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GithubCommitService {

    private final GithubClient githubClient;

    public GithubCommitService(GithubClient githubClient) {
        this.githubClient = githubClient;
    }

    public List<GithubCommitDto> fetchCommits(String owner, String repo, String branch, String since) {
        return githubClient.listCommits(owner, repo, branch, since);
    }

    public Optional<GithubCommitDto> fetchCommitDetail(String owner, String repo, String sha) {
        return githubClient.getCommit(owner, repo, sha);
    }
}
