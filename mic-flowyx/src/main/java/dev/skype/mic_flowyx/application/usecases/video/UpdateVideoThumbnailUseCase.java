package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class UpdateVideoThumbnailUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public UpdateVideoThumbnailUseCase(VideoRepository videoRepository,
                                        UserRepository userRepository,
                                        StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    public Video execute(UUID videoId, String userEmail, InputStream thumbnailStream, long thumbnailSize) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.userId().equals(user.id())) {
            throw new VideoAccessDeniedException(videoId);
        }

        return uploadAndUpdate(video, thumbnailStream, thumbnailSize);
    }

    /** Public so the admin use case can reuse the core logic without duplicating it. */
    public Video uploadAndUpdate(Video video, InputStream thumbnailStream, long thumbnailSize) {
        String thumbnailKey = "videos/%s/%s/thumbnail.jpg".formatted(video.userId(), video.id());
        storagePort.upload(thumbnailKey, thumbnailStream, thumbnailSize, "image/jpeg");

        Video updated = new Video(
                video.id(),
                video.userId(),
                video.description(),
                video.tags(),
                video.videoKey(),
                thumbnailKey,
                video.fileSizeBytes(),
                video.contentType(),
                video.status(),
                video.createdAt(),
                OffsetDateTime.now()
        );
        return videoRepository.update(updated);
    }
}
