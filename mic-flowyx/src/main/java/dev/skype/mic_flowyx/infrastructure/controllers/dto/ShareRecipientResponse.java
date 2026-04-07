package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import dev.skype.mic_flowyx.application.usecases.sharing.GetShareRecipientsUseCase.RecipientInfo;

import java.util.List;
import java.util.UUID;

public record ShareRecipientResponse(
        UUID userId,
        String nickname,
        String pictureUrl,
        List<UUID> videoIds
) {
    public static ShareRecipientResponse fromDomain(RecipientInfo info) {
        return new ShareRecipientResponse(
                info.user().id(),
                info.user().nickname(),
                info.user().pictureUrl(),
                info.videoIds()
        );
    }
}
