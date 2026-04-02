package dev.skype.mic_flowyx.domain.entities;

import java.time.OffsetDateTime;
import java.util.UUID;

public record VideoShare(
        UUID videoId,
        UUID sharedWithUserId,
        UUID sharedByUserId,
        OffsetDateTime createdAt
) {}
