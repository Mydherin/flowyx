package dev.skypea.mic_flowyx.application.repositories;

import dev.skypea.mic_flowyx.domain.entities.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    List<User> findAll();
    boolean existsById(String id);
    Optional<User> findById(String id);
    Optional<User> findByEmail(String email);
    User save(User user);
}
