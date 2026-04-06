package dev.skype.mic_flowyx.application.usecases.sharing;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.entities.VideoShare;
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
public class ShareVideosUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;

    public ShareVideosUseCase(VideoRepository videoRepository,
                               UserRepository userRepository,
                               VideoShareRepository videoShareRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
    }

    public void execute(List<UUID> videoIds, List<UUID> sharedWithUserIds, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UserNotFoundException(ownerEmail));

        for (UUID videoId : videoIds) {
            Video video = videoRepository.findById(videoId)
                    .orElseThrow(() -> new VideoNotFoundException(videoId));

            if (!video.userId().equals(owner.id())) {
                throw new VideoAccessDeniedException(videoId);
            }
        }

        List<VideoShare> newShares = videoIds.stream()
                .flatMap(videoId -> sharedWithUserIds.stream()
                        .filter(userId -> !userId.equals(owner.id()))
                        .filter(userId -> !videoShareRepository.exists(videoId, userId))
                        .map(userId -> new VideoShare(videoId, userId, owner.id(), OffsetDateTime.now(), null)))
                .toList();

        if (!newShares.isEmpty()) {
            videoShareRepository.saveAll(newShares);
        }
    }
}
