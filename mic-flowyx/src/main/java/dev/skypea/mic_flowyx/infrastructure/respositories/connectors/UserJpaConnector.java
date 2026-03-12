package dev.skypea.mic_flowyx.infrastructure.respositories.connectors;

import dev.skypea.mic_flowyx.infrastructure.respositories.connectors.entities.UserJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserJpaConnector extends JpaRepository<UserJpaEntity, String> {
    Optional<UserJpaEntity> findByEmail(String email);
}
