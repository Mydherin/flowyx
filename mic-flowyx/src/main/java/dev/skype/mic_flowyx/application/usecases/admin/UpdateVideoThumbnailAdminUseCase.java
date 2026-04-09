package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.application.usecases.video.UpdateVideoThumbnailUseCase;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.UUID;

@Service
public class UpdateVideoThumbnailAdminUseCase {

    private final VideoRepository videoRepository;
    private final UpdateVideoThumbnailUseCase updateVideoThumbnailUseCase;

    public UpdateVideoThumbnailAdminUseCase(VideoRepository videoRepository,
                                             UpdateVideoThumbnailUseCase updateVideoThumbnailUseCase) {
        this.videoRepository = videoRepository;
        this.updateVideoThumbnailUseCase = updateVideoThumbnailUseCase;
    }

    /** Admin-scoped: no ownership check — admins can update thumbnails for any video. */
    public Video execute(UUID videoId, InputStream thumbnailStream, long thumbnailSize) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));
        return updateVideoThumbnailUseCase.uploadAndUpdate(video, thumbnailStream, thumbnailSize);
    }
}
