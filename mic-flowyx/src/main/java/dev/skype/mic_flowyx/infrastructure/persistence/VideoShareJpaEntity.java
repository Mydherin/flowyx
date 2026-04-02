package dev.skype.mic_flowyx.infrastructure.persistence;

import dev.skype.mic_flowyx.domain.entities.VideoShare;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "video_shares")
@IdClass(VideoShareId.class)
@Builder
@NoArgsConstructor
@AllArgsConstructor
class VideoShareJpaEntity {

    @Id
    @Column(name = "video_id", nullable = false, updatable = false)
    private UUID videoId;

    @Id
    @Column(name = "shared_with_user_id", nullable = false, updatable = false)
    private UUID sharedWithUserId;

    @Column(name = "shared_by_user_id", nullable = false, updatable = false)
    private UUID sharedByUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    static VideoShareJpaEntity fromDomain(VideoShare share) {
        return VideoShareJpaEntity.builder()
                .videoId(share.videoId())
                .sharedWithUserId(share.sharedWithUserId())
                .sharedByUserId(share.sharedByUserId())
                .createdAt(share.createdAt())
                .build();
    }

    VideoShare toDomain() {
        return new VideoShare(videoId, sharedWithUserId, sharedByUserId, createdAt);
    }
}
