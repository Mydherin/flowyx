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
import java.util.List;

@Service
public class UpdateVideoUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;

    public UpdateVideoUseCase(VideoRepository videoRepository, UserRepository userRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
    }

    public Video execute(UpdateVideoCommand command) {
        User user = userRepository.findByEmail(command.userEmail())
                .orElseThrow(() -> new UserNotFoundException(command.userEmail()));

        Video video = videoRepository.findById(command.videoId())
                .orElseThrow(() -> new VideoNotFoundException(command.videoId()));

        if (!video.userId().equals(user.id())) {
            throw new VideoAccessDeniedException(command.videoId());
        }

        List<String> tags = command.tags() != null ? command.tags() : video.tags();
        List<String> sortedTags = new ArrayList<>(tags);
        sortedTags.sort(String.CASE_INSENSITIVE_ORDER);

        Video updated = new Video(
                video.id(),
                video.userId(),
                command.description() != null ? command.description() : video.description(),
                sortedTags,
                video.videoKey(),
                video.thumbnailKey(),
                video.fileSizeBytes(),
                video.contentType(),
                video.status(),
                video.createdAt(),
                OffsetDateTime.now()
        );

        return videoRepository.update(updated);
    }
}
