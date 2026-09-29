package com.ideax.codemonitor.exception;

import org.springframework.http.HttpStatus;

public class DuplicateCheckpointException extends ApiException {
    public DuplicateCheckpointException(Long sprintId, Long teamId) {
        super(HttpStatus.CONFLICT, "DUPLICATE_CHECKPOINT",
                String.format("Checkpoint already exists for sprint %d and team %d", sprintId, teamId));
    }
}
