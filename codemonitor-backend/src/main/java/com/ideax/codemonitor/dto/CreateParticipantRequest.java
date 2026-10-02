package com.ideax.codemonitor.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateParticipantRequest {

    @NotNull(message = "Team ID is required")
    private Long teamId;

    @NotBlank(message = "GitHub username is required")
    @Size(max = 100, message = "GitHub username cannot exceed 100 characters")
    private String githubUsername;

    @JsonAlias("name")
    @Size(max = 150, message = "Display name cannot exceed 150 characters")
    private String displayName;

    private Long githubUserId;

    private String role;
}
