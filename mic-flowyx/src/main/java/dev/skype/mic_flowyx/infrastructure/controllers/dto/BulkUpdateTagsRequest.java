package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import java.util.List;
import java.util.UUID;

public record BulkUpdateTagsRequest(List<UUID> videoIds, List<String> tags) {}
