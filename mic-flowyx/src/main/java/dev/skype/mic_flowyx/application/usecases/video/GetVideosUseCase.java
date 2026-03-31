package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetVideosUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public GetVideosUseCase(VideoRepository videoRepository,
                             UserRepository userRepository,
                             StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    public List<VideoWithUrls> execute(String userEmail, List<String> tags) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        List<Video> videos = videoRepository.findByUserId(user.id(), tags);

        return videos.stream()
                .map(v -> new VideoWithUrls(
                        v,
                        storagePort.getObjectUrl(v.videoKey()),
                        v.thumbnailKey() != null ? storagePort.getObjectUrl(v.thumbnailKey()) : null
                ))
                .toList();
    }
}
