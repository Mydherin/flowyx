package dev.skype.mic_flowyx.application.usecases;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class SignInUseCase {

    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public SignInUseCase(UserRepository userRepository, StoragePort storagePort) {
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    public User execute(SignInCommand command) {
        User existing = userRepository.findByEmail(command.email().toLowerCase())
                .orElseThrow(() -> new UserNotFoundException(command.email()));

        String resolvedPicture = resolveAvatarUrl(existing.id().toString(), command.picture(), existing.pictureUrl());
        if (resolvedPicture != null && !resolvedPicture.equals(existing.pictureUrl())) {
            User updated = new User(
                    existing.id(),
                    existing.nickname(),
                    existing.email(),
                    resolvedPicture,
                    existing.role(),
                    existing.createdAt()
            );
            return userRepository.update(updated);
        }

        return existing;
    }

    /**
     * Returns the URL to store for the user's avatar:
     * - If already on S3 (starts with "/media/"), keep the existing URL.
     * - Otherwise, attempt to upload the Google picture to S3 and return the S3 URL.
     * - Falls back to the Google URL if upload fails, or null if no picture provided.
     */
    private String resolveAvatarUrl(String userId, String googlePictureUrl, String existingPictureUrl) {
        if (googlePictureUrl == null) return null;
        if (existingPictureUrl != null && existingPictureUrl.startsWith("/media/")) return existingPictureUrl;
        String key = storagePort.storeFromUrl("avatars/" + userId, googlePictureUrl);
        return key != null ? storagePort.getObjectUrl(key) : googlePictureUrl;
    }
}
