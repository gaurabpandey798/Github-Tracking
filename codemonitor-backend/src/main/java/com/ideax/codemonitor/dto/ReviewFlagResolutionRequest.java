package com.ideax.codemonitor.dto;

import com.ideax.codemonitor.entity.ReviewFlag;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewFlagResolutionRequest {

    @NotNull(message = "Status is required (REVIEWED or DISMISSED)")
    private ReviewFlag.ReviewFlagStatus status;

    private String reviewNote;
}
