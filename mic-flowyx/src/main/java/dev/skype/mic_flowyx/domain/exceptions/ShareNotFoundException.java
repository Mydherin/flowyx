package dev.skype.mic_flowyx.domain.exceptions;

import java.util.UUID;

public class ShareNotFoundException extends RuntimeException {
    public ShareNotFoundException(UUID videoId, UUID userId) {
        super("Share not found for video " + videoId + " and user " + userId);
    }
}
