package dev.skype.mic_flowyx.infrastructure.security;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleTokenInfo(
        @JsonProperty("aud") String aud,
        @JsonProperty("email") String email,
        @JsonProperty("email_verified") String emailVerified,
        @JsonProperty("expires_in") String expiresIn,
        @JsonProperty("sub") String sub
) {}
