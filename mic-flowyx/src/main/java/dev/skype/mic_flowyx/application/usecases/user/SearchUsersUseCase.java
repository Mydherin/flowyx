package dev.skype.mic_flowyx.application.usecases.user;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchUsersUseCase {

    private final UserRepository userRepository;

    public SearchUsersUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> execute(String query, String callerEmail) {
        if (query == null || query.trim().length() < 2) {
            throw new IllegalArgumentException("Search query must be at least 2 characters");
        }

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new UserNotFoundException(callerEmail));

        return userRepository.searchByNicknameOrEmail(query.trim(), caller.id())
                .stream()
                .limit(20)
                .toList();
    }
}
