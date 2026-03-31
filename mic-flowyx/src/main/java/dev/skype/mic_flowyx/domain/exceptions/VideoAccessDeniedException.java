package dev.skype.mic_flowyx.domain.exceptions;

import java.util.UUID;

public class VideoAccessDeniedException extends RuntimeException {
    public VideoAccessDeniedException(UUID id) {
        super("Access denied to video: " + id);
    }
}
