package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.entities.VideoStatus;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.SequenceInputStream;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
public class CompleteVideoUploadUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public CompleteVideoUploadUseCase(VideoRepository videoRepository,
                                      UserRepository userRepository,
                                      StoragePort storagePort) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    public Video execute(
            UUID videoId,
            String userEmail,
            String description,
            List<String> tags,
            int totalChunks,
            long totalSize,
            String fileName,
            String contentType,
            InputStream thumbnailStream,
            long thumbnailSize
    ) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        String ext = extractExtension(fileName);
        String videoKey = "videos/%s/%s/video.%s".formatted(user.id(), videoId, ext);
        String thumbnailKey = thumbnailStream != null
                ? "videos/%s/%s/thumbnail.jpg".formatted(user.id(), videoId)
                : null;

        List<String> chunkKeys = IntStream.range(0, totalChunks)
                .mapToObj(i -> "tmp/%s/chunk-%04d".formatted(videoId, i))
                .collect(java.util.stream.Collectors.toList());

        // Open all chunk streams upfront so we can close them in finally
        List<InputStream> chunkStreams = new ArrayList<>(totalChunks);
        boolean videoUploaded = false;
        boolean thumbnailUploaded = false;

        try {
            for (String chunkKey : chunkKeys) {
                chunkStreams.add(storagePort.getObject(chunkKey));
            }

            InputStream combined = new SequenceInputStream(Collections.enumeration(chunkStreams));
            storagePort.upload(videoKey, combined, totalSize, contentType);
            videoUploaded = true;

            if (thumbnailStream != null) {
                storagePort.upload(thumbnailKey, thumbnailStream, thumbnailSize, "image/jpeg");
                thumbnailUploaded = true;
            }

            List<String> sortedTags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
            sortedTags.sort(String.CASE_INSENSITIVE_ORDER);

            Video video = new Video(
                    videoId,
                    user.id(),
                    description,
                    sortedTags,
                    videoKey,
                    thumbnailKey,
                    totalSize,
                    contentType,
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
        } finally {
            for (InputStream s : chunkStreams) {
                try { s.close(); } catch (Exception ignored) {}
            }
            for (String chunkKey : chunkKeys) {
                try { storagePort.delete(chunkKey); } catch (Exception ignored) {}
            }
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || filename.isBlank()) return "mp4";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1).toLowerCase() : "mp4";
    }
}
