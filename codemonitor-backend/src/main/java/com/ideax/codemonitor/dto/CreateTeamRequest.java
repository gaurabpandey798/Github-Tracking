package com.ideax.codemonitor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamRequest {

    @NotNull(message = "teamNumber is required")
    @Min(value = 1, message = "teamNumber must be greater than 0")
    private Integer teamNumber;

    @NotBlank(message = "teamName is required")
    private String teamName;
}
