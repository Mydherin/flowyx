package dev.skype.mic_flowyx.infrastructure.persistence;

import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class JpaUserRepository implements UserRepository {

    private final SpringDataUserRepository springDataRepo;

    public JpaUserRepository(SpringDataUserRepository springDataRepo) {
        this.springDataRepo = springDataRepo;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return springDataRepo.findByEmail(email).map(UserJpaEntity::toDomain);
    }

    @Override
    public User save(User user) {
        return springDataRepo.save(UserJpaEntity.fromDomain(user)).toDomain();
    }

    @Override
    public User update(User user) {
        return springDataRepo.save(UserJpaEntity.fromDomain(user)).toDomain();
    }
}
