package dev.skype.mic_flowyx.application.usecases.sharing;

import dev.skype.mic_flowyx.domain.entities.User;
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
public class GetShareRecipientsUseCase {

    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;

    public GetShareRecipientsUseCase(UserRepository userRepository,
                                      VideoShareRepository videoShareRepository) {
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
    }

    public record RecipientInfo(User user, List<UUID> videoIds) {}

    public List<RecipientInfo> execute(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UserNotFoundException(ownerEmail));

        List<VideoShare> shares = videoShareRepository.findBySharedByUserId(owner.id());

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
