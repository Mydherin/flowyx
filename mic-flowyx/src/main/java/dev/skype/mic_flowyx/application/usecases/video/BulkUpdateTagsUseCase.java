package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BulkUpdateTagsUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;

    public BulkUpdateTagsUseCase(VideoRepository videoRepository, UserRepository userRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
    }

    public List<Video> execute(List<UUID> videoIds, List<String> tagsToAdd, List<String> tagsToRemove, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        return videoIds.stream().map(id -> {
            Video video = videoRepository.findById(id)
                    .orElseThrow(() -> new VideoNotFoundException(id));

            if (!video.userId().equals(user.id())) {
                throw new VideoAccessDeniedException(id);
            }

            // Apply delta: start with existing tags, add new ones, remove specified ones
            Set<String> updatedTags = new HashSet<>(video.tags());
            updatedTags.addAll(tagsToAdd);
            updatedTags.removeAll(tagsToRemove);
            List<String> sortedTags = new ArrayList<>(updatedTags);
            sortedTags.sort(String.CASE_INSENSITIVE_ORDER);

            Video updated = new Video(
                    video.id(), video.userId(), video.description(), sortedTags,
                    video.videoKey(), video.thumbnailKey(), video.fileSizeBytes(),
                    video.contentType(), video.status(), video.createdAt(), OffsetDateTime.now()
            );

            return videoRepository.update(updated);
        }).toList();
    }
}
