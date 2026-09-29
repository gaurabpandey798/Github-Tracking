package com.ideax.codemonitor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideax.codemonitor.github.GithubClient;
import com.ideax.codemonitor.github.GithubProperties;
import com.ideax.codemonitor.github.dto.GithubRepoDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

public class GithubClientPatchTest {

    @Test
    @DisplayName("Verify that JdkClientHttpRequestFactory creates PATCH requests without ProtocolException")
    void verifyJdkClientSupportsPatchMethod() {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        assertThatCode(() -> {
            ClientHttpRequest request = factory.createRequest(URI.create("https://api.github.com/repos/MBMC-IdeaX/Team-4NF"), HttpMethod.PATCH);
            assertThat(request.getMethod()).isEqualTo(HttpMethod.PATCH);
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Verify that GithubClient correctly executes HTTP PATCH requests")
    void verifyPatchMethodSupported() {
        GithubProperties properties = new GithubProperties();
        properties.getApi().setBaseUrl("https://api.github.com");
        properties.setToken("mock-test-pat");

        ObjectMapper objectMapper = new ObjectMapper();
        RestClient.Builder builder = RestClient.builder().baseUrl(properties.getApi().getBaseUrl());

        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        GithubClient githubClient = new GithubClient(properties, restClient, objectMapper);

        String responseJson = """
                {
                    "id": 1391942535,
                    "name": "Team-4NF",
                    "full_name": "MBMC-IdeaX/Team-4NF",
                    "archived": true
                }
                """;

        server.expect(requestTo("https://api.github.com/repos/MBMC-IdeaX/Team-4NF"))
                .andExpect(method(HttpMethod.PATCH))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.archived").value(true))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        GithubRepoDto result = githubClient.updateRepositoryArchived("MBMC-IdeaX", "Team-4NF", true);

        server.verify();
        assertThat(result).isNotNull();
        assertThat(result.isArchived()).isTrue();
        assertThat(result.getFullName()).isEqualTo("MBMC-IdeaX/Team-4NF");
    }
}
