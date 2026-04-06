package dev.skype.mic_flowyx.application.usecases.sharing;

import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class MarkVideoViewedUseCase {

    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;

    public MarkVideoViewedUseCase(UserRepository userRepository,
                                   VideoShareRepository videoShareRepository) {
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
    }

    @Transactional
    public void execute(UUID videoId, String viewerEmail) {
        var viewer = userRepository.findByEmail(viewerEmail)
                .orElseThrow(() -> new UserNotFoundException(viewerEmail));

        if (!videoShareRepository.exists(videoId, viewer.id())) {
            throw new VideoAccessDeniedException(videoId);
        }

        videoShareRepository.markViewed(videoId, viewer.id());
    }
}
