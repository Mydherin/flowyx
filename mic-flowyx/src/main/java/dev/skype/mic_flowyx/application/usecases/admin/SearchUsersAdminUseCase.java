package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchUsersAdminUseCase {

    private final UserRepository userRepository;

    public SearchUsersAdminUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> execute(String query) {
        if (query == null || query.trim().length() < 2) {
            throw new IllegalArgumentException("Search query must be at least 2 characters");
        }
        return userRepository.searchByNicknameOrEmail(query.trim())
                .stream()
                .limit(20)
                .toList();
    }
}
