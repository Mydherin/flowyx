package dev.skype.mic_flowyx.infrastructure.persistence;

import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.entities.VideoStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "videos")
@Builder
@NoArgsConstructor
@AllArgsConstructor
class VideoJpaEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "video_tags", joinColumns = @JoinColumn(name = "video_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "video_key", nullable = false, columnDefinition = "TEXT")
    private String videoKey;

    @Column(name = "thumbnail_key", columnDefinition = "TEXT")
    private String thumbnailKey;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VideoStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    static VideoJpaEntity fromDomain(Video video) {
        VideoJpaEntity entity = VideoJpaEntity.builder()
                .id(video.id())
                .userId(video.userId())
                .description(video.description())
                .videoKey(video.videoKey())
                .thumbnailKey(video.thumbnailKey())
                .fileSizeBytes(video.fileSizeBytes())
                .contentType(video.contentType())
                .status(video.status())
                .createdAt(video.createdAt())
                .updatedAt(video.updatedAt())
                .build();
        entity.tags = video.tags() != null ? new ArrayList<>(video.tags()) : new ArrayList<>();
        return entity;
    }

    Video toDomain() {
        return new Video(
                id, userId, description,
                tags != null ? List.copyOf(tags) : List.of(),
                videoKey, thumbnailKey, fileSizeBytes, contentType,
                status, createdAt, updatedAt
        );
    }
}
