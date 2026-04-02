package dev.skype.mic_flowyx.infrastructure.persistence;

import java.io.Serializable;
import java.util.UUID;

class VideoShareId implements Serializable {
    UUID videoId;
    UUID sharedWithUserId;

    VideoShareId() {}

    VideoShareId(UUID videoId, UUID sharedWithUserId) {
        this.videoId = videoId;
        this.sharedWithUserId = sharedWithUserId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VideoShareId other)) return false;
        return java.util.Objects.equals(videoId, other.videoId)
                && java.util.Objects.equals(sharedWithUserId, other.sharedWithUserId);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(videoId, sharedWithUserId);
    }
}
