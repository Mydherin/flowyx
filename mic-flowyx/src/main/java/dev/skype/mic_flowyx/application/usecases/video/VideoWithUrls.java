package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.domain.entities.Video;

public record VideoWithUrls(Video video, String videoUrl, String thumbnailUrl) {}
