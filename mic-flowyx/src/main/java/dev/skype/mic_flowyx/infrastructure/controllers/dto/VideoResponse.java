package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import dev.skype.mic_flowyx.application.usecases.video.VideoWithUrls;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record VideoResponse(
        UUID id,
        UUID userId,
        String description,
        List<String> tags,
        String videoUrl,
        String thumbnailUrl,
        Long fileSizeBytes,
        String contentType,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        int sharedWithCount,
        boolean isOwner
) {
    public static VideoResponse fromDomain(VideoWithUrls v) {
        return new VideoResponse(
                v.video().id(),
                v.video().userId(),
                v.video().description(),
                v.video().tags(),
                v.videoUrl(),
                v.thumbnailUrl(),
                v.video().fileSizeBytes(),
                v.video().contentType(),
                v.video().status().name(),
                v.video().createdAt(),
                v.video().updatedAt(),
                v.sharedWithCount(),
                v.isOwner()
        );
    }
}
