package com.ideax.codemonitor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseEventRequest {

    @NotBlank(message = "Release note is mandatory")
    @Size(min = 3, max = 1000, message = "Release note must be between 3 and 1000 characters")
    private String note;
}
