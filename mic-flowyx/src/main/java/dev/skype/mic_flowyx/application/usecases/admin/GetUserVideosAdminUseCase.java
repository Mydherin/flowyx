package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.application.usecases.video.VideoWithUrls;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GetUserVideosAdminUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;
    private final StoragePort storagePort;

    public GetUserVideosAdminUseCase(VideoRepository videoRepository,
                                     UserRepository userRepository,
                                     VideoShareRepository videoShareRepository,
                                     StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
        this.storagePort = storagePort;
    }

    public List<VideoWithUrls> execute(UUID targetUserId, List<String> tags) {
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException(targetUserId.toString()));

        List<Video> videos = videoRepository.findByUserId(targetUserId, tags);

        return videos.stream()
                .map(v -> new VideoWithUrls(
                        v,
                        storagePort.getObjectUrl(v.videoKey()),
                        v.thumbnailKey() != null ? storagePort.getObjectUrl(v.thumbnailKey()) : null,
                        videoShareRepository.countByVideoId(v.id()),
                        true
                ))
                .toList();
    }
}
