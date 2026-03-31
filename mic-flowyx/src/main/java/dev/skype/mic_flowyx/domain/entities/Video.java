package dev.skype.mic_flowyx.domain.entities;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record Video(
        UUID id,
        UUID userId,
        String description,
        List<String> tags,
        String videoKey,
        String thumbnailKey,
        Long fileSizeBytes,
        String contentType,
        VideoStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
