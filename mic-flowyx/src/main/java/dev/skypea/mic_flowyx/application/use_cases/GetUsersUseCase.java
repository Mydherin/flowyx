package dev.skypea.mic_flowyx.application.use_cases;

import dev.skypea.mic_flowyx.application.repositories.UserRepository;
import dev.skypea.mic_flowyx.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetUsersUseCase {

    private final UserRepository userRepository;

    public List<User> run() {
        return userRepository.findAll();
    }
}
