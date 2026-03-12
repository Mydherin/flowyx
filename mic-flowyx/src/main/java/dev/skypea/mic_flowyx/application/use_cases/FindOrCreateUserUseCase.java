package dev.skypea.mic_flowyx.application.use_cases;

import dev.skypea.mic_flowyx.application.repositories.UserRepository;
import dev.skypea.mic_flowyx.domain.entities.Role;
import dev.skypea.mic_flowyx.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FindOrCreateUserUseCase {

    public static class Command {
        private final String id;
        private final String name;
        private final String email;

        public Command(String id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
    }

    private final UserRepository userRepository;

    public User run(Command command) {
        return userRepository.findById(command.getId())
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .id(command.getId())
                                .name(command.getName())
                                .email(command.getEmail())
                                .role(Role.USER)
                                .build()
                ));
    }
}
