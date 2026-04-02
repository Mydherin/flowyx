package dev.skype.mic_flowyx.application.usecases.sharing;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.application.usecases.video.VideoWithUrls;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GetSharedVideosUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;
    private final StoragePort storagePort;

    public GetSharedVideosUseCase(VideoRepository videoRepository,
                                   UserRepository userRepository,
                                   VideoShareRepository videoShareRepository,
                                   StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
        this.storagePort = storagePort;
    }

    public List<VideoWithUrls> execute(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        List<UUID> sharedVideoIds = videoShareRepository.findVideoIdsBySharedWithUserId(user.id());

        return sharedVideoIds.stream()
                .map(id -> videoRepository.findById(id).orElse(null))
                .filter(v -> v != null)
                .map(v -> new VideoWithUrls(
                        v,
                        storagePort.getObjectUrl(v.videoKey()),
                        v.thumbnailKey() != null ? storagePort.getObjectUrl(v.thumbnailKey()) : null,
                        0,
                        false
                ))
                .toList();
    }
}
