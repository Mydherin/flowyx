package dev.skypea.mic_flowyx.infrastructure.security;

import dev.skypea.mic_flowyx.infrastructure.configs.GoogleOAuthProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleOAuthService {

    private final GoogleOAuthProperties properties;
    private final RestClient restClient;

    public GoogleOAuthService(GoogleOAuthProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create();
    }

    public String buildAuthorizationUrl(String state) {
        return UriComponentsBuilder.fromUriString(properties.getAuthEndpoint())
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("state", state)
                .toUriString();
    }

    public GoogleTokenResponse exchangeCode(String code) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("code", code);
        formData.add("client_id", properties.getClientId());
        formData.add("client_secret", properties.getClientSecret());
        formData.add("redirect_uri", properties.getRedirectUri());
        formData.add("grant_type", "authorization_code");

        return restClient.post()
                .uri(properties.getTokenEndpoint())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(GoogleTokenResponse.class);
    }

    public GoogleUserInfo getUserInfo(String accessToken) {
        return restClient.get()
                .uri(properties.getUserinfoEndpoint())
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(GoogleUserInfo.class);
    }
}
