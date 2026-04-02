package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import dev.skype.mic_flowyx.application.usecases.sharing.GetVideoSharesUseCase.ShareInfo;

import java.time.OffsetDateTime;
import java.util.UUID;

public record VideoShareResponse(
        UUID userId,
        String nickname,
        String email,
        String pictureUrl,
        OffsetDateTime sharedAt
) {
    public static VideoShareResponse fromDomain(ShareInfo info) {
        return new VideoShareResponse(
                info.user().id(),
                info.user().nickname(),
                info.user().email(),
                info.user().pictureUrl(),
                info.share().createdAt()
        );
    }
}
