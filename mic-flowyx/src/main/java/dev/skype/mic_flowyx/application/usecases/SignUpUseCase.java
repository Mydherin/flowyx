package dev.skype.mic_flowyx.application.usecases;

import dev.skype.mic_flowyx.domain.entities.Role;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserAlreadyExistsException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
public class SignUpUseCase {

    private final UserRepository userRepository;

    public SignUpUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User execute(SignUpCommand command) {
        // Anti-impersonation: the email in the body must match the token's email
        if (!command.tokenEmail().equalsIgnoreCase(command.email())) {
            throw new IllegalArgumentException("Token email does not match request email");
        }

        if (userRepository.findByEmail(command.email().toLowerCase()).isPresent()) {
            throw new UserAlreadyExistsException(command.email());
        }

        User newUser = new User(
                command.uuid(),
                command.nickname(),
                command.email().toLowerCase(),
                command.picture(),
                Role.USER,
                OffsetDateTime.now()
        );

        return userRepository.save(newUser);
    }
}
