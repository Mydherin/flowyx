package dev.skype.mic_flowyx.domain.entities;

import java.time.OffsetDateTime;
import java.util.UUID;

public record User(
        UUID id,
        String nickname,
        String email,
        String pictureUrl,
        Role role,
        OffsetDateTime createdAt
) {}
