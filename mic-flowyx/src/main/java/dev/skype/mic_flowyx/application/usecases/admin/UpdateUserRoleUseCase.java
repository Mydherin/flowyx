package dev.skype.mic_flowyx.application.usecases.admin;

import dev.skype.mic_flowyx.domain.entities.Role;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UpdateUserRoleUseCase {

    private final UserRepository userRepository;

    public UpdateUserRoleUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User execute(UUID targetUserId, Role newRole, String adminEmail) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException(targetUserId.toString()));

        // Prevent admin from demoting themselves
        if (target.email().equalsIgnoreCase(adminEmail)) {
            throw new IllegalArgumentException("Admins cannot change their own role");
        }

        return userRepository.updateRole(targetUserId, newRole);
    }
}
