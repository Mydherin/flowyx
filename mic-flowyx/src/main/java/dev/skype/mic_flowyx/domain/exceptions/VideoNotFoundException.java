package dev.skype.mic_flowyx.domain.exceptions;

import java.util.UUID;

public class VideoNotFoundException extends RuntimeException {
    public VideoNotFoundException(UUID id) {
        super("Video not found with id: " + id);
    }
}
