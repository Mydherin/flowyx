package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import dev.skype.mic_flowyx.domain.entities.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String nickname,
        String email,
        String pictureUrl,
        String role,
        OffsetDateTime createdAt
) {
    public static AdminUserResponse fromDomain(User user) {
        return new AdminUserResponse(
                user.id(),
                user.nickname(),
                user.email(),
                user.pictureUrl(),
                user.role().name(),
                user.createdAt()
        );
    }
}
