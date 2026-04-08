package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.application.usecases.sharing.GetShareRecipientsUseCase.RecipientInfo;
import dev.skype.mic_flowyx.domain.entities.VideoShare;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GetShareRecipientsAdminUseCase {

    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;

    public GetShareRecipientsAdminUseCase(UserRepository userRepository,
                                          VideoShareRepository videoShareRepository) {
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
    }

    /**
     * Returns share recipients for a given user's videos, bypassing ownership check.
     * Reuses RecipientInfo from the existing GetShareRecipientsUseCase.
     */
    public List<RecipientInfo> execute(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId.toString()));

        List<VideoShare> shares = videoShareRepository.findBySharedByUserId(userId);

        Map<UUID, List<UUID>> videoIdsByRecipient = shares.stream()
                .collect(Collectors.groupingBy(
                        VideoShare::sharedWithUserId,
                        Collectors.mapping(VideoShare::videoId, Collectors.toList())
                ));

        return videoIdsByRecipient.entrySet().stream()
                .map(e -> userRepository.findById(e.getKey())
                        .map(u -> new RecipientInfo(u, e.getValue()))
                        .orElse(null))
                .filter(r -> r != null)
                .toList();
    }
}
