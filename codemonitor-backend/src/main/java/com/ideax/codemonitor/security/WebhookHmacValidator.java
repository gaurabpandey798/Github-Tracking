package com.ideax.codemonitor.security;

import com.ideax.codemonitor.exception.InvalidWebhookSignatureException;
import com.ideax.codemonitor.github.GithubProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
public class WebhookHmacValidator {

    private static final Logger log = LoggerFactory.getLogger(WebhookHmacValidator.class);
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String SIGNATURE_PREFIX = "sha256=";

    private final GithubProperties githubProperties;

    public WebhookHmacValidator(GithubProperties githubProperties) {
        this.githubProperties = githubProperties;
    }

    public void validateSignature(byte[] payload, String signatureHeader) {
        String secret = githubProperties.getWebhook().getSecret();

        if (!StringUtils.hasText(secret)) {
            log.warn("GITHUB_WEBHOOK_SECRET is not configured! Webhook signature check is bypassed for testing.");
            return;
        }

        if (!StringUtils.hasText(signatureHeader) || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
            throw new InvalidWebhookSignatureException("Missing or malformed X-Hub-Signature-256 header");
        }

        String expectedHash = signatureHeader.substring(SIGNATURE_PREFIX.length());

        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] computedBytes = mac.doFinal(payload);
            String computedHash = HexFormat.of().formatHex(computedBytes);

            // Time-constant comparison to prevent side-channel timing attacks
            boolean matches = MessageDigest.isEqual(
                    expectedHash.getBytes(StandardCharsets.UTF_8),
                    computedHash.getBytes(StandardCharsets.UTF_8)
            );

            if (!matches) {
                log.warn("Invalid webhook signature received");
                throw new InvalidWebhookSignatureException("Webhook signature verification failed");
            }
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("HMAC computation error", e);
            throw new InvalidWebhookSignatureException("Internal error verifying webhook signature: " + e.getMessage());
        }
    }
}
