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

import java.util.UUID;

@Service
public class DeleteVideoUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public DeleteVideoUseCase(VideoRepository videoRepository,
                               UserRepository userRepository,
                               StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    public void execute(UUID videoId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.userId().equals(user.id())) {
            throw new VideoAccessDeniedException(videoId);
        }

        storagePort.delete(video.videoKey());
        if (video.thumbnailKey() != null) {
            storagePort.delete(video.thumbnailKey());
        }

        videoRepository.delete(videoId);
    }
}
