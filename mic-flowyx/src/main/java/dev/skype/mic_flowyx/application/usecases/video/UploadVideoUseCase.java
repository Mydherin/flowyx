package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.entities.VideoStatus;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class UploadVideoUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public UploadVideoUseCase(VideoRepository videoRepository,
                               UserRepository userRepository,
                               StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    public Video execute(UploadVideoCommand command) {
        User user = userRepository.findByEmail(command.userEmail())
                .orElseThrow(() -> new UserNotFoundException(command.userEmail()));

        String ext = extractExtension(command.videoOriginalFilename());
        String videoKey = "videos/%s/%s/video.%s".formatted(user.id(), command.videoId(), ext);
        String thumbnailKey = command.hasThumbnail()
                ? "videos/%s/%s/thumbnail.jpg".formatted(user.id(), command.videoId())
                : null;

        boolean videoUploaded = false;
        boolean thumbnailUploaded = false;
        try {
            storagePort.upload(videoKey, command.videoStream(), command.videoSize(), command.videoContentType());
            videoUploaded = true;

            if (command.hasThumbnail()) {
                storagePort.upload(thumbnailKey, command.thumbnailStream(), command.thumbnailSize(), "image/jpeg");
                thumbnailUploaded = true;
            }

            List<String> tags = command.tags() != null ? new ArrayList<>(command.tags()) : new ArrayList<>();
            tags.sort(String.CASE_INSENSITIVE_ORDER);

            Video video = new Video(
                    command.videoId(),
                    user.id(),
                    command.description(),
                    tags,
                    videoKey,
                    thumbnailKey,
                    command.videoSize(),
                    command.videoContentType(),
                    VideoStatus.READY,
                    OffsetDateTime.now(),
                    OffsetDateTime.now()
            );

            return videoRepository.save(video);
        } catch (Exception e) {
            if (videoUploaded) {
                try { storagePort.delete(videoKey); } catch (Exception ignored) {}
            }
            if (thumbnailUploaded && thumbnailKey != null) {
                try { storagePort.delete(thumbnailKey); } catch (Exception ignored) {}
            }
            throw e;
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || filename.isBlank()) return "mp4";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1).toLowerCase() : "mp4";
    }
}
