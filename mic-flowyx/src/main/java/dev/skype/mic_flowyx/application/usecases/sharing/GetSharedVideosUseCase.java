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

        return videoShareRepository.findBySharedWithUserId(user.id()).stream()
                .map(share -> {
                    var video = videoRepository.findById(share.videoId()).orElse(null);
                    if (video == null) return null;
                    var sharedBy = userRepository.findById(share.sharedByUserId()).orElse(null);
                    return new VideoWithUrls(
                            video,
                            storagePort.getObjectUrl(video.videoKey()),
                            video.thumbnailKey() != null ? storagePort.getObjectUrl(video.thumbnailKey()) : null,
                            0,
                            false,
                            sharedBy != null ? sharedBy.id() : share.sharedByUserId(),
                            sharedBy != null ? sharedBy.nickname() : null,
                            sharedBy != null ? sharedBy.pictureUrl() : null,
                            share.viewedAt() == null
                    );
                })
                .filter(v -> v != null)
                .sorted((a, b) -> {
                    if (a.isNew() != b.isNew()) return a.isNew() ? -1 : 1;
                    return b.video().createdAt().compareTo(a.video().createdAt());
                })
                .toList();
    }
}
