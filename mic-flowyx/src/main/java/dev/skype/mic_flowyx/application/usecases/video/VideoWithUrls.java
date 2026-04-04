package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.domain.entities.Video;

import java.util.UUID;

public record VideoWithUrls(
        Video video,
        String videoUrl,
        String thumbnailUrl,
        int sharedWithCount,
        boolean isOwner,
        UUID sharedByUserId,
        String sharedByNickname,
        String sharedByPictureUrl
) {
    /** Convenience constructor for owned/single-video use cases where sharedBy is not applicable. */
    public VideoWithUrls(Video video, String videoUrl, String thumbnailUrl, int sharedWithCount, boolean isOwner) {
        this(video, videoUrl, thumbnailUrl, sharedWithCount, isOwner, null, null, null);
    }
}
