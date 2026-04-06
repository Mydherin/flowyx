package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BulkCloneVideosUseCase {

    private final CloneVideoUseCase cloneVideoUseCase;
    private final UserRepository userRepository;

    public BulkCloneVideosUseCase(CloneVideoUseCase cloneVideoUseCase,
                                   UserRepository userRepository) {
        this.cloneVideoUseCase = cloneVideoUseCase;
        this.userRepository = userRepository;
    }

    /**
     * Clones multiple shared videos into the caller's library.
     * Silently skips videos that are not accessible or cannot be cloned.
     * Returns the list of resulting Video entities (new or idempotent existing).
     */
    public List<Video> execute(List<UUID> videoIds, String userEmail) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(userEmail));

        List<Video> cloned = new ArrayList<>();
        for (UUID id : videoIds) {
            try {
                cloned.add(cloneVideoUseCase.execute(id, userEmail));
            } catch (Exception ignored) {
                // Skip videos that cannot be cloned (not shared, already owned, not found)
            }
        }
        return cloned;
    }
}
