package dev.skype.mic_flowyx.application.usecases.video;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

public record UploadVideoCommand(
        String userEmail,
        UUID videoId,
        String description,
        List<String> tags,
        InputStream videoStream,
        long videoSize,
        String videoContentType,
        String videoOriginalFilename,
        InputStream thumbnailStream,
        long thumbnailSize
) {
    public boolean hasThumbnail() {
        return thumbnailStream != null && thumbnailSize > 0;
    }
}
