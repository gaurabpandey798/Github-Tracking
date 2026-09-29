package com.ideax.codemonitor.github.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubRepoDto {
    private Long id;
    private String name;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("html_url")
    private String htmlUrl;

    @JsonProperty("default_branch")
    @Builder.Default
    private String defaultBranch = "main";

    @JsonProperty("private")
    private boolean isPrivate;

    @JsonProperty("archived")
    private boolean isArchived;

    private OwnerDto owner;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OwnerDto {
        private Long id;
        private String login;
    }
}
