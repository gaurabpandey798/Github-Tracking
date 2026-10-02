package com.ideax.codemonitor.exception;

import org.springframework.http.HttpStatus;

public class GitHubRepositoryNotFoundException extends ApiException {
    public GitHubRepositoryNotFoundException(String owner, String repoName) {
        super(HttpStatus.NOT_FOUND, "GITHUB_REPOSITORY_NOT_FOUND",
                String.format("GitHub repository %s/%s was not found or is not accessible.", owner, repoName));
    }
}
