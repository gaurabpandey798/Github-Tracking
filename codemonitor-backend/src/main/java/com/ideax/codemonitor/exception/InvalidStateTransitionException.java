package com.ideax.codemonitor.exception;

import org.springframework.http.HttpStatus;

public class InvalidStateTransitionException extends ApiException {
    public InvalidStateTransitionException(String code, String message) {
        super(HttpStatus.BAD_REQUEST, code, message);
    }

    public static InvalidStateTransitionException eventAlreadyActive() {
        return new InvalidStateTransitionException("EVENT_ALREADY_ACTIVE", "Event is already active and cannot be released again.");
    }

    public static InvalidStateTransitionException eventNotStarted() {
        return new InvalidStateTransitionException("EVENT_NOT_STARTED", "Event must be ACTIVE to perform sprint operations.");
    }

    public static InvalidStateTransitionException eventCompleted() {
        return new InvalidStateTransitionException("EVENT_COMPLETED", "Event is already completed.");
    }

    public static InvalidStateTransitionException sprintAlreadyFrozen(int sprintNumber) {
        return new InvalidStateTransitionException("SPRINT_ALREADY_FROZEN", "Sprint " + sprintNumber + " is already frozen.");
    }

    public static InvalidStateTransitionException sprintNotActive(int sprintNumber) {
        return new InvalidStateTransitionException("SPRINT_NOT_ACTIVE", "Sprint " + sprintNumber + " is not currently active.");
    }

    public static InvalidStateTransitionException previousSprintNotFrozen(int sprintNumber) {
        return new InvalidStateTransitionException("PREVIOUS_SPRINT_NOT_FROZEN", "Previous sprint must be FROZEN before releasing sprint " + sprintNumber + ".");
    }
}
