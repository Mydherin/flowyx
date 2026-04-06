package dev.skype.mic_flowyx.domain.repositories;

import dev.skype.mic_flowyx.domain.entities.Video;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VideoRepository {
    Video save(Video video);
    Optional<Video> findById(UUID id);
    List<Video> findByUserId(UUID userId, List<String> tags);
    Optional<Video> findByUserIdAndVideoKey(UUID userId, String videoKey);
    int countByVideoKey(String videoKey);
    Video update(Video video);
    void delete(UUID id);
}
