package dev.skype.mic_flowyx.domain.repositories;

import dev.skype.mic_flowyx.domain.entities.User;

import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    User save(User user);
    User update(User user);
}
