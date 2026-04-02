package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import dev.skype.mic_flowyx.domain.entities.User;

import java.util.UUID;

public record UserSearchResponse(
        UUID id,
        String nickname,
        String email,
        String pictureUrl
) {
    public static UserSearchResponse fromDomain(User user) {
        return new UserSearchResponse(user.id(), user.nickname(), user.email(), user.pictureUrl());
    }
}
