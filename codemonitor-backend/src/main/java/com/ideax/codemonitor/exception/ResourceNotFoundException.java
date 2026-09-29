package com.ideax.codemonitor.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND",
                String.format("%s with identifier '%s' was not found", resourceName, identifier));
    }
}
