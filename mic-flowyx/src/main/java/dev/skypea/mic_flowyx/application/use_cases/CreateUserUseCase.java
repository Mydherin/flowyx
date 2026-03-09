package dev.skypea.mic_flowyx.application.use_cases;

import dev.skypea.mic_flowyx.application.repositories.UserRepository;
import dev.skypea.mic_flowyx.domain.entities.User;
import dev.skypea.mic_flowyx.domain.exceptions.UserAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreateUserUseCase {

    public static class Command {
        private final UUID id;
        private final String name;
        private final String email;

        public Command(UUID id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public UUID getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
    }

    private final UserRepository userRepository;

    public User run(Command command) {
        if (userRepository.existsById(command.getId())) {
            throw new UserAlreadyExistsException(command.getId());
        }
        return userRepository.save(
                User.builder()
                        .id(command.getId())
                        .name(command.getName())
                        .email(command.getEmail())
                        .build()
        );
    }
}
