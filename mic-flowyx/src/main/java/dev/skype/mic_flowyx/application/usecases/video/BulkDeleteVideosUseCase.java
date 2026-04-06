package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BulkDeleteVideosUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public BulkDeleteVideosUseCase(VideoRepository videoRepository,
                                    UserRepository userRepository,
                                    StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    /** Returns the IDs of videos actually deleted (skips non-existent and non-owned). */
    public List<UUID> execute(List<UUID> videoIds, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        List<UUID> deleted = new ArrayList<>();

        for (UUID id : videoIds) {
            videoRepository.findById(id).ifPresent(video -> {
                if (video.userId().equals(user.id())) {
                    boolean isLastOwner = videoRepository.countByVideoKey(video.videoKey()) == 1;
                    videoRepository.delete(id);
                    if (isLastOwner) {
                        storagePort.delete(video.videoKey());
                        if (video.thumbnailKey() != null) {
                            storagePort.delete(video.thumbnailKey());
                        }
                    }
                    deleted.add(id);
                }
            });
        }

        return deleted;
    }
}
