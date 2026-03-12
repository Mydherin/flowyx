package dev.skypea.mic_flowyx.infrastructure.respositories;

import dev.skypea.mic_flowyx.application.repositories.UserRepository;
import dev.skypea.mic_flowyx.domain.entities.User;
import dev.skypea.mic_flowyx.infrastructure.respositories.connectors.UserJpaConnector;
import dev.skypea.mic_flowyx.infrastructure.respositories.connectors.entities.UserJpaEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserPostgresRepository implements UserRepository {

    private final UserJpaConnector userJpaConnector;

    @Override
    public List<User> findAll() {
        return userJpaConnector.findAll()
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public boolean existsById(String id) {
        return userJpaConnector.existsById(id);
    }

    @Override
    public Optional<User> findById(String id) {
        return userJpaConnector.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userJpaConnector.findByEmail(email).map(this::toDomain);
    }

    @Override
    public User save(User user) {
        UserJpaEntity entity = UserJpaEntity.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
        return toDomain(userJpaConnector.save(entity));
    }

    private User toDomain(UserJpaEntity entity) {
        return User.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .role(entity.getRole())
                .build();
    }
}
