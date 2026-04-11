package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Downloads a single video as a raw file (no zip).
 * Sets Content-Type, Content-Disposition, and Content-Length before streaming
 * so the browser uses the original filename and content type.
 * Touches updatedAt after a successful stream so the video surfaces as recently accessed.
 */
@Service
public class DownloadVideoUseCase {

    private static final Logger log = LoggerFactory.getLogger(DownloadVideoUseCase.class);

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;
    private final StoragePort storagePort;

    public DownloadVideoUseCase(VideoRepository videoRepository,
                                UserRepository userRepository,
                                VideoShareRepository videoShareRepository,
                                StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
        this.storagePort = storagePort;
    }

    public void execute(UUID videoId, String userEmail, HttpServletResponse response) throws IOException {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        boolean isOwner = video.userId().equals(user.id());
        boolean isShared = !isOwner && videoShareRepository.exists(videoId, user.id());
        if (!isOwner && !isShared) throw new VideoAccessDeniedException(videoId);

        String filename = buildFilename(video);
        response.setContentType(video.contentType() != null ? video.contentType() : "application/octet-stream");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        if (video.fileSizeBytes() != null && video.fileSizeBytes() > 0) {
            response.setContentLengthLong(video.fileSizeBytes());
        }

        try (InputStream is = storagePort.getObject(video.videoKey())) {
            is.transferTo(response.getOutputStream());
        }

        // Touch updatedAt — best-effort; a failure here must not surface as an error to the client
        // since the response is already committed at this point.
        try {
            videoRepository.update(new Video(
                    video.id(), video.userId(), video.description(), video.tags(),
                    video.videoKey(), video.thumbnailKey(), video.fileSizeBytes(),
                    video.contentType(), video.status(), video.createdAt(), OffsetDateTime.now()
            ));
        } catch (Exception e) {
            log.warn("Failed to touch updatedAt for video {} after download: {}", videoId, e.getMessage());
        }
    }

    private String buildFilename(Video video) {
        String key = video.videoKey();
        String ext = key.contains(".") ? key.substring(key.lastIndexOf('.')) : "";
        String name = video.description() != null && !video.description().isBlank()
                ? video.description().replaceAll("[^a-zA-Z0-9_\\- ]", "").trim()
                : video.id().toString();
        if (name.isBlank()) name = video.id().toString();
        return name + ext;
    }
}
