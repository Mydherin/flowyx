package dev.skype.mic_flowyx.infrastructure.persistence;

import dev.skype.mic_flowyx.domain.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataUserRepository extends JpaRepository<UserJpaEntity, UUID> {
    Optional<UserJpaEntity> findByEmail(String email);

    @Query("SELECT u FROM UserJpaEntity u WHERE u.id != :excludeId AND (LOWER(u.nickname) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:q,'%')))")
    List<UserJpaEntity> searchByNicknameOrEmail(@Param("q") String q, @Param("excludeId") UUID excludeId);

    @Modifying
    @Transactional
    @Query("UPDATE UserJpaEntity u SET u.role = :role WHERE u.id = :id")
    int updateRoleById(@Param("id") UUID id, @Param("role") Role role);
}
