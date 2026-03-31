package dev.skype.mic_flowyx.application.usecases.video;

import java.util.List;
import java.util.UUID;

public record UpdateVideoCommand(
        UUID videoId,
        String userEmail,
        String description,
        List<String> tags
) {}
