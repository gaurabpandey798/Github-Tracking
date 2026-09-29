package com.ideax.codemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositorySyncResponse {
    private Long repositoryId;
    private String fullName;
    private String defaultBranch;
    private String headSha;
    private int newCommitsCount;
    private int totalCommitsCount;
    private int flaggedIssuesCount;
    @Builder.Default
    private List<String> detectedContributors = new ArrayList<>();
    @Builder.Default
    private List<String> flagsCreated = new ArrayList<>();
}
