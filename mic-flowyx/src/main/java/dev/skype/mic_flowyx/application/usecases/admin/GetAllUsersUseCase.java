package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetAllUsersUseCase {

    private final UserRepository userRepository;

    public GetAllUsersUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> execute() {
        return userRepository.findAll();
    }
}
