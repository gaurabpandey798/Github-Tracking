package com.ideax.codemonitor.exception;

import org.springframework.http.HttpStatus;

public class GitHubApiException extends ApiException {
    public GitHubApiException(String message) {
        super(HttpStatus.BAD_GATEWAY, "GITHUB_API_ERROR", message);
    }

    public GitHubApiException(String message, Throwable cause) {
        super(HttpStatus.BAD_GATEWAY, "GITHUB_API_ERROR", message, cause);
    }

    public GitHubApiException(HttpStatus status, String code, String message) {
        super(status, code, message);
    }
}
