package com.ideax.codemonitor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRepositoryRequest {

    private Long teamId;

    private Integer teamNumber;

    private String owner;

    @NotBlank(message = "Repository name is required")
    private String name;
}
