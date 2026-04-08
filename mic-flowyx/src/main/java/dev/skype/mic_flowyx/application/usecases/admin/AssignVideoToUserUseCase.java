package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.entities.VideoStatus;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class AssignVideoToUserUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;

    public AssignVideoToUserUseCase(VideoRepository videoRepository,
                                    UserRepository userRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
    }

    /**
     * Assigns (admin-clones) a video into a target user's library.
     * Unlike the user-facing CloneVideoUseCase, this bypasses share-access checks
     * and preserves the source video's description and tags.
     * Idempotent: if the target already owns a video backed by the same file, that video is returned.
     */
    public Video execute(UUID sourceVideoId, UUID targetUserId) {
        Video source = videoRepository.findById(sourceVideoId)
                .orElseThrow(() -> new VideoNotFoundException(sourceVideoId));

        userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException(targetUserId.toString()));

        // Idempotent: return existing copy if target already owns this file
        return videoRepository.findByUserIdAndVideoKey(targetUserId, source.videoKey())
                .orElseGet(() -> videoRepository.save(new Video(
                        UUID.randomUUID(),
                        targetUserId,
                        source.description(),
                        source.tags(),
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
