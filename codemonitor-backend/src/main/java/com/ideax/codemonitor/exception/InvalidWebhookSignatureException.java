package com.ideax.codemonitor.exception;

import org.springframework.http.HttpStatus;

public class InvalidWebhookSignatureException extends ApiException {
    public InvalidWebhookSignatureException(String message) {
        super(HttpStatus.UNAUTHORIZED, "INVALID_WEBHOOK_SIGNATURE", message);
    }
}
