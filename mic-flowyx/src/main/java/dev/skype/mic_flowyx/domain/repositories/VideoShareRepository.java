package dev.skype.mic_flowyx.domain.repositories;

import dev.skype.mic_flowyx.domain.entities.VideoShare;

import java.util.List;
import java.util.UUID;

public interface VideoShareRepository {
    void save(VideoShare share);
    void saveAll(List<VideoShare> shares);
    void delete(UUID videoId, UUID sharedWithUserId);
    List<VideoShare> findByVideoId(UUID videoId);
    List<UUID> findVideoIdsBySharedWithUserId(UUID userId);
    List<VideoShare> findBySharedWithUserId(UUID userId);
    boolean exists(UUID videoId, UUID sharedWithUserId);
    int countByVideoId(UUID videoId);
}
