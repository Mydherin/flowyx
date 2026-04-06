package dev.skype.mic_flowyx.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataVideoRepository extends JpaRepository<VideoJpaEntity, UUID> {

    @Query("SELECT DISTINCT v FROM VideoJpaEntity v WHERE v.userId = :userId ORDER BY v.createdAt DESC")
    List<VideoJpaEntity> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT v FROM VideoJpaEntity v JOIN v.tags t WHERE v.userId = :userId AND t IN :tags ORDER BY v.createdAt DESC")
    List<VideoJpaEntity> findByUserIdAndTagsIn(@Param("userId") UUID userId, @Param("tags") List<String> tags);

    Optional<VideoJpaEntity> findFirstByUserIdAndVideoKey(UUID userId, String videoKey);

    int countByVideoKey(String videoKey);
}
