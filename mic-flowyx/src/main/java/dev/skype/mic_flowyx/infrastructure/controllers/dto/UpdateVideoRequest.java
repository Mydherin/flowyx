package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import java.util.List;

public record UpdateVideoRequest(
        String description,
        List<String> tags
) {}
