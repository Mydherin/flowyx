package dev.skype.mic_flowyx.infrastructure.persistence;

import dev.skype.mic_flowyx.domain.entities.Role;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.domain.exceptions.UserNotFoundException;
import dev.skype.mic_flowyx.domain.repositories.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    public Optional<User> findById(UUID id) {
        return springDataRepo.findById(id).map(UserJpaEntity::toDomain);
    }

    @Override
    public List<User> searchByNicknameOrEmail(String query, UUID excludeUserId) {
        return springDataRepo.searchByNicknameOrEmail(query, excludeUserId).stream()
                .map(UserJpaEntity::toDomain)
                .toList();
    }

    @Override
    public User save(User user) {
        return springDataRepo.save(UserJpaEntity.fromDomain(user)).toDomain();
    }

    @Override
    public List<User> findAll() {
        return springDataRepo.findAll().stream()
                .map(UserJpaEntity::toDomain)
                .toList();
    }

    @Override
    public User update(User user) {
        return springDataRepo.save(UserJpaEntity.fromDomain(user)).toDomain();
    }

    @Override
    public User updateRole(UUID id, Role role) {
        User user = findById(id)
                .orElseThrow(() -> new UserNotFoundException(id.toString()));
        springDataRepo.updateRoleById(id, role);
        return new User(user.id(), user.nickname(), user.email(), user.pictureUrl(), role, user.createdAt());
    }
}
