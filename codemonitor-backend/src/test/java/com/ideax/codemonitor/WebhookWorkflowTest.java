package com.ideax.codemonitor;

import com.ideax.codemonitor.controller.GithubWebhookController;
import com.ideax.codemonitor.entity.GitRepository;
import com.ideax.codemonitor.entity.Team;
import com.ideax.codemonitor.repository.GitRepositoryRepository;
import com.ideax.codemonitor.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class WebhookWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private GitRepositoryRepository gitRepositoryRepository;

    private static final String TEST_SECRET = "my-test-webhook-secret-key-123456";

    @BeforeEach
    void setup() {
        Team team = teamRepository.findByTeamNumber(1).orElseGet(() ->
                teamRepository.save(Team.builder().teamNumber(1).teamName("Team 4NF").build())
        );

        gitRepositoryRepository.findByFullNameIgnoreCase("MBMC-IdeaX/Team-4NF").orElseGet(() ->
                gitRepositoryRepository.save(GitRepository.builder()
                        .githubRepositoryId(1391942535L)
                        .owner("MBMC-IdeaX")
                        .name("Team-4NF")
                        .fullName("MBMC-IdeaX/Team-4NF")
                        .url("https://github.com/MBMC-IdeaX/Team-4NF")
                        .team(team)
                        .build())
        );
    }

    private String computeHmacSha256(byte[] data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(data));
    }

    @Test
    @DisplayName("Requirement 11: Invalid webhook signature is rejected with HTTP 401")
    void invalidSignature_RejectedWith401() throws Exception {
        byte[] payload = "{\"action\":\"ping\"}".getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/webhooks/github")
                        .header("X-GitHub-Event", "ping")
                        .header("X-GitHub-Delivery", "test-delivery-101")
                        .header("X-Hub-Signature-256", "sha256=invalidhash00000000000000000000000000000000000000000000000000000000")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_WEBHOOK_SIGNATURE"));
    }

    @Test
    @DisplayName("Valid webhook signature passes verification")
    void validSignature_Accepted() throws Exception {
        byte[] payload = "{\"action\":\"ping\"}".getBytes(StandardCharsets.UTF_8);
        String validSig = computeHmacSha256(payload, TEST_SECRET);

        mockMvc.perform(post("/api/webhooks/github")
                        .header("X-GitHub-Event", "ping")
                        .header("X-GitHub-Delivery", "test-delivery-102")
                        .header("X-Hub-Signature-256", validSig)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PONG"));
    }

    @Test
    @DisplayName("Requirement 10: Duplicate webhook delivery is ignored idempotently")
    void duplicateDelivery_Ignored() throws Exception {
        byte[] payload = "{\"action\":\"ping\"}".getBytes(StandardCharsets.UTF_8);
        String validSig = computeHmacSha256(payload, TEST_SECRET);
        String deliveryId = "unique-delivery-uuid-9999";

        // First delivery: should succeed
        mockMvc.perform(post("/api/webhooks/github")
                        .header("X-GitHub-Event", "ping")
                        .header("X-GitHub-Delivery", deliveryId)
                        .header("X-Hub-Signature-256", validSig)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PONG"));

        // Second delivery with same delivery ID: must be IGNORED_DUPLICATE
        mockMvc.perform(post("/api/webhooks/github")
                        .header("X-GitHub-Event", "ping")
                        .header("X-GitHub-Delivery", deliveryId)
                        .header("X-Hub-Signature-256", validSig)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IGNORED_DUPLICATE"))
                .andExpect(jsonPath("$.deliveryId").value(deliveryId));
    }

    @Test
    @DisplayName("Push webhook processes commits and updates repository activity")
    void pushWebhook_ProcessesCommits() throws Exception {
        String payloadJson = """
                {
                  "ref": "refs/heads/main",
                  "after": "deadbeef12345678",
                  "forced": false,
                  "pusher": {
                    "name": "legitimate-dev"
                  },
                  "repository": {
                    "id": 1391942535,
                    "name": "Team-4NF",
                    "full_name": "MBMC-IdeaX/Team-4NF"
                  },
                  "commits": [
                    {
                      "id": "c0ffee11223344",
                      "message": "Implement initial architecture",
                      "timestamp": "2026-09-28T10:00:00Z",
                      "url": "https://github.com/MBMC-IdeaX/Team-4NF/commit/c0ffee11223344",
                      "author": {
                        "name": "legitimate-dev",
                        "username": "legitimate-dev"
                      },
                      "added": ["src/App.java"],
                      "removed": [],
                      "modified": []
                    }
                  ]
                }
                """;

        byte[] payloadBytes = payloadJson.getBytes(StandardCharsets.UTF_8);
        String validSig = computeHmacSha256(payloadBytes, TEST_SECRET);
        String deliveryId = "push-delivery-001";

        mockMvc.perform(post("/api/webhooks/github")
                        .header("X-GitHub-Event", "push")
                        .header("X-GitHub-Delivery", deliveryId)
                        .header("X-Hub-Signature-256", validSig)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadBytes))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.event").value("push"));
    }
}
