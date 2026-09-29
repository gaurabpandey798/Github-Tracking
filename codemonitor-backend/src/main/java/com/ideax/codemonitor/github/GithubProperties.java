package com.ideax.codemonitor.github;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "github")
@Getter
@Setter
public class GithubProperties {

    private Api api = new Api();
    private String organization = "MBMC-IdeaX";
    private String token;
    private Webhook webhook = new Webhook();

    @Getter
    @Setter
    public static class Api {
        private String baseUrl = "https://api.github.com";
        private String version = "2022-11-28";
    }

    @Getter
    @Setter
    public static class Webhook {
        private String secret;
    }
}
