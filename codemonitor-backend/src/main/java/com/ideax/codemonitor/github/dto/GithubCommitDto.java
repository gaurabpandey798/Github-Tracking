package com.ideax.codemonitor.github.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubCommitDto {
    private String sha;

    @JsonProperty("html_url")
    private String htmlUrl;

    private CommitDetails commit;
    private GithubUser author;
    private GithubUser committer;
    private CommitStats stats;
    private List<CommitFile> files;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CommitDetails {
        private String message;
        private GitAuthor author;
        private GitAuthor committer;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GitAuthor {
        private String name;
        private String email;
        private String date; // ISO 8601 string
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GithubUser {
        private Long id;
        private String login;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CommitStats {
        private int total;
        private int additions;
        private int deletions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CommitFile {
        private String filename;
        private int additions;
        private int deletions;
        private int changes;
        private String status;
    }
}
