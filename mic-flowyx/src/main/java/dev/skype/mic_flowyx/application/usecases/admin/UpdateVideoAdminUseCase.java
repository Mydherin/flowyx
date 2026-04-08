package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class UpdateVideoAdminUseCase {

    private final VideoRepository videoRepository;

    public UpdateVideoAdminUseCase(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    /**
     * Updates a video's metadata without ownership check — for admin use only.
     */
    public Video execute(UUID videoId, String description, java.util.List<String> tags) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        Video updated = new Video(
                video.id(),
                video.userId(),
                description != null ? description : video.description(),
                tags != null ? tags : video.tags(),
                video.videoKey(),
                video.thumbnailKey(),
                video.fileSizeBytes(),
                video.contentType(),
                video.status(),
                video.createdAt(),
                OffsetDateTime.now()
        );

        return videoRepository.update(updated);
    }
}
