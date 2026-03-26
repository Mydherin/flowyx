package dev.skype.mic_flowyx.application.usecases;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class SignInUseCase {

    private final UserRepository userRepository;

    public SignInUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User execute(SignInCommand command) {
        User existing = userRepository.findByEmail(command.email().toLowerCase())
                .orElseThrow(() -> new UserNotFoundException(command.email()));

        // Always sync the latest Google avatar URL if it has changed
        if (command.picture() != null && !command.picture().equals(existing.pictureUrl())) {
            User updated = new User(
                    existing.id(),
                    existing.nickname(),
                    existing.email(),
                    command.picture(),
                    existing.role(),
                    existing.createdAt()
            );
            return userRepository.update(updated);
        }

        return existing;
    }
}
