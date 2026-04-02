package dev.skype.mic_flowyx.application.usecases.sharing;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.entities.VideoShare;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.exceptions.VideoAccessDeniedException;
import dev.skype.mic_flowyx.domain.exceptions.VideoNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class GetVideoSharesUseCase {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final VideoShareRepository videoShareRepository;

    public GetVideoSharesUseCase(VideoRepository videoRepository,
                                  UserRepository userRepository,
                                  VideoShareRepository videoShareRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.videoShareRepository = videoShareRepository;
    }

    public record ShareInfo(User user, VideoShare share) {}

    public List<ShareInfo> execute(UUID videoId, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UserNotFoundException(ownerEmail));

        var video = videoRepository.findById(videoId)
                .orElseThrow(() -> new VideoNotFoundException(videoId));

        if (!video.userId().equals(owner.id())) {
            throw new VideoAccessDeniedException(videoId);
        }

        List<VideoShare> shares = videoShareRepository.findByVideoId(videoId);

        Map<UUID, User> userMap = shares.stream()
                .map(VideoShare::sharedWithUserId)
                .distinct()
                .map(userId -> userRepository.findById(userId).orElse(null))
                .filter(u -> u != null)
                .collect(Collectors.toMap(User::id, Function.identity()));

        return shares.stream()
                .filter(s -> userMap.containsKey(s.sharedWithUserId()))
                .map(s -> new ShareInfo(userMap.get(s.sharedWithUserId()), s))
                .toList();
    }
}
