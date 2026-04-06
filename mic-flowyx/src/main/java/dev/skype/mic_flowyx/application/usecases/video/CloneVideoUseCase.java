package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.entities.VideoStatus;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CloneVideoUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;

    public CloneVideoUseCase(VideoRepository videoRepository,
                              UserRepository userRepository,
                              VideoShareRepository videoShareRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
    }

    /**
     * Clones a video that has been shared with the caller into the caller's own library.
     * No S3 copy is made — both records point to the same underlying files.
     * Idempotent: if the caller already owns a video backed by the same file, that video is returned.
     */
    public Video execute(UUID sourceVideoId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        Video source = videoRepository.findById(sourceVideoId)
                .orElseThrow(() -> new VideoNotFoundException(sourceVideoId));

        // Only shared videos can be cloned; you cannot clone your own video
        if (source.userId().equals(user.id())) {
            throw new VideoAccessDeniedException(sourceVideoId);
        }

        if (!videoShareRepository.exists(sourceVideoId, user.id())) {
            throw new VideoAccessDeniedException(sourceVideoId);
        }

        // Idempotent: return existing clone if the user already owns this file
        return videoRepository.findByUserIdAndVideoKey(user.id(), source.videoKey())
                .orElseGet(() -> videoRepository.save(new Video(
                        UUID.randomUUID(),
                        user.id(),
                        "",
                        List.of(),
                        source.videoKey(),
                        source.thumbnailKey(),
                        source.fileSizeBytes(),
                        source.contentType(),
                        VideoStatus.READY,
                        OffsetDateTime.now(),
                        OffsetDateTime.now()
                )));
    }
}
