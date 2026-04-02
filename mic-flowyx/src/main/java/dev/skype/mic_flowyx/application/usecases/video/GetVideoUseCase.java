package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GetVideoUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;
    private final StoragePort storagePort;

    public GetVideoUseCase(VideoRepository videoRepository,
                            UserRepository userRepository,
                            VideoShareRepository videoShareRepository,
                            StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
        this.storagePort = storagePort;
    }

    public VideoWithUrls execute(UUID videoId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        boolean isOwner = video.userId().equals(user.id());
        boolean isSharedWithUser = !isOwner && videoShareRepository.exists(videoId, user.id());

        if (!isOwner && !isSharedWithUser) {
            throw new VideoAccessDeniedException(videoId);
        }

        int sharedWithCount = isOwner ? videoShareRepository.countByVideoId(videoId) : 0;

        return new VideoWithUrls(
                video,
                storagePort.getObjectUrl(video.videoKey()),
                video.thumbnailKey() != null ? storagePort.getObjectUrl(video.thumbnailKey()) : null,
                sharedWithCount,
                isOwner
        );
    }
}
