package dev.skype.mic_flowyx.domain.repositories;

import dev.skype.mic_flowyx.domain.entities.Role;
import dev.skype.mic_flowyx.domain.entities.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    Optional<User> findById(UUID id);
    List<User> findAll();
    List<User> searchByNicknameOrEmail(String query, UUID excludeUserId);
    List<User> searchByNicknameOrEmail(String query);
    User save(User user);
    User update(User user);
    User updateRole(UUID id, Role role);
}
