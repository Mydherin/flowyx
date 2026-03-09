package dev.skypea.mic_flowyx.application.repositories;

import dev.skypea.mic_flowyx.domain.entities.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    List<User> findAll();
    boolean existsById(UUID id);
    Optional<User> findById(UUID id);
    Optional<User> findByEmail(String email);
    User save(User user);
}
