package dev.skype.mic_flowyx.application.usecases.sharing;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.ShareNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UnshareVideoUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;

    public UnshareVideoUseCase(VideoRepository videoRepository,
                                UserRepository userRepository,
                                VideoShareRepository videoShareRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
    }

    public void execute(UUID videoId, UUID sharedWithUserId, String callerEmail) {
        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new UserNotFoundException(callerEmail));

        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        boolean isOwner = video.userId().equals(caller.id());
        boolean isSelfRemoval = caller.id().equals(sharedWithUserId);

        if (!isOwner && !isSelfRemoval) {
            throw new VideoAccessDeniedException(videoId);
        }

        if (!videoShareRepository.exists(videoId, sharedWithUserId)) {
            throw new ShareNotFoundException(videoId, sharedWithUserId);
        }

        videoShareRepository.delete(videoId, sharedWithUserId);
    }
}
