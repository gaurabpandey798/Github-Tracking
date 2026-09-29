package com.ideax.codemonitor.controller;

import com.ideax.codemonitor.security.WebhookHmacValidator;
import com.ideax.codemonitor.webhook.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/github")
@Tag(name = "GitHub Webhook Controller", description = "Receives and validates incoming GitHub webhook events with HMAC SHA-256")
public class GithubWebhookController {

    private static final Logger log = LoggerFactory.getLogger(GithubWebhookController.class);

    private final WebhookHmacValidator webhookHmacValidator;
    private final WebhookService webhookService;

    public GithubWebhookController(WebhookHmacValidator webhookHmacValidator, WebhookService webhookService) {
        this.webhookHmacValidator = webhookHmacValidator;
        this.webhookService = webhookService;
    }

    @PostMapping
    @Operation(summary = "GitHub Webhook Receiver",
               description = "Accepts GitHub push and pull_request webhook events, verifies HMAC SHA-256 signature, ensures delivery idempotency, and detects unusual activity.")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestHeader(value = "X-GitHub-Delivery", required = false) String deliveryId,
            @RequestHeader(value = "X-GitHub-Event", required = false, defaultValue = "push") String event,
            @RequestBody byte[] payloadBytes) {

        log.info("Received GitHub Webhook: event='{}', deliveryId='{}'", event, deliveryId);

        // 1. Verify HMAC SHA-256 signature
        webhookHmacValidator.validateSignature(payloadBytes, signature);

        // 2. Check Idempotency
        if (webhookService.isDeliveryAlreadyProcessed(deliveryId)) {
            log.info("Delivery ID '{}' already processed. Ignoring duplicate delivery.", deliveryId);
            return ResponseEntity.ok(Map.of(
                    "status", "IGNORED_DUPLICATE",
                    "deliveryId", deliveryId != null ? deliveryId : "N/A"
            ));
        }

        String payloadJson = new String(payloadBytes, StandardCharsets.UTF_8);

        // 3. Process events
        if ("ping".equalsIgnoreCase(event)) {
            log.info("GitHub ping event received successfully.");
            webhookService.recordDelivery(deliveryId, event);
            return ResponseEntity.ok(Map.of("status", "PONG"));
        } else if ("push".equalsIgnoreCase(event)) {
            webhookService.processPushEvent(payloadJson);
            webhookService.recordDelivery(deliveryId, event);
        } else if ("pull_request".equalsIgnoreCase(event)) {
            webhookService.processPullRequestEvent(payloadJson);
            webhookService.recordDelivery(deliveryId, event);
        } else {
            log.info("Ignoring unhandled event type: {}", event);
            webhookService.recordDelivery(deliveryId, event);
        }

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "event", event,
                "deliveryId", deliveryId != null ? deliveryId : "N/A"
        ));
    }
}
