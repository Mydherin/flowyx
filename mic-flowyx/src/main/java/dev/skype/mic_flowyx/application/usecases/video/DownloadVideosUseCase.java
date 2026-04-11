package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class DownloadVideosUseCase {

    private static final Logger log = LoggerFactory.getLogger(DownloadVideosUseCase.class);

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;
    private final StoragePort storagePort;

    public DownloadVideosUseCase(VideoRepository videoRepository,
                                  UserRepository userRepository,
                                  VideoShareRepository videoShareRepository,
                                  StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
        this.storagePort = storagePort;
    }

    public void execute(List<UUID> videoIds, String userEmail, OutputStream out) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        try (var zip = new ZipOutputStream(out)) {
            zip.setLevel(Deflater.NO_COMPRESSION);

            for (UUID videoId : videoIds) {
                var video = videoRepository.findById(videoId).orElse(null);
                if (video == null) continue;

                boolean isOwner = video.userId().equals(user.id());
                boolean isShared = !isOwner && videoShareRepository.exists(videoId, user.id());
                if (!isOwner && !isShared) continue;

                String entryName = buildEntryName(video);
                zip.putNextEntry(new ZipEntry(entryName));
                try (InputStream is = storagePort.getObject(video.videoKey())) {
                    is.transferTo(zip);
                } catch (Exception e) {
                    log.warn("Failed to stream video {} into zip: {}", videoId, e.getMessage());
                }
                zip.closeEntry();

                // Touch updatedAt — best-effort; skipped on error so one bad video
                // doesn't abort the remaining entries.
                try {
                    videoRepository.update(new Video(
                            video.id(), video.userId(), video.description(), video.tags(),
                            video.videoKey(), video.thumbnailKey(), video.fileSizeBytes(),
                            video.contentType(), video.status(), video.createdAt(), OffsetDateTime.now()
                    ));
                } catch (Exception e) {
                    log.warn("Failed to touch updatedAt for video {} after zip: {}", videoId, e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create zip archive", e);
        }
    }

    private String buildEntryName(Video video) {
        String key = video.videoKey();
        String ext = key.contains(".") ? key.substring(key.lastIndexOf('.')) : "";
        String name = video.description() != null && !video.description().isBlank()
                ? video.description().replaceAll("[^a-zA-Z0-9_\\- ]", "").trim()
                : video.id().toString();
        if (name.isBlank()) name = video.id().toString();
        return name + ext;
    }
}
