package dev.skype.mic_flowyx.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient googleRestClient() {
        return RestClient.builder()
                .baseUrl("https://www.googleapis.com")
                .build();
    }
}
