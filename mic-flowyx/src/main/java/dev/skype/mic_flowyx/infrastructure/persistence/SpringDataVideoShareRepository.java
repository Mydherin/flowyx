package dev.skype.mic_flowyx.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

interface SpringDataVideoShareRepository extends JpaRepository<VideoShareJpaEntity, VideoShareId> {

    List<VideoShareJpaEntity> findByVideoId(UUID videoId);

    @Query("SELECT s.videoId FROM VideoShareJpaEntity s WHERE s.sharedWithUserId = :userId")
    List<UUID> findVideoIdsBySharedWithUserId(@Param("userId") UUID userId);

    List<VideoShareJpaEntity> findBySharedWithUserId(UUID sharedWithUserId);

    boolean existsByVideoIdAndSharedWithUserId(UUID videoId, UUID sharedWithUserId);

    void deleteByVideoIdAndSharedWithUserId(UUID videoId, UUID sharedWithUserId);

    int countByVideoId(UUID videoId);
}
