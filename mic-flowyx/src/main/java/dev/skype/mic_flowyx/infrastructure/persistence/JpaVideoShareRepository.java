package dev.skype.mic_flowyx.infrastructure.persistence;

import dev.skype.mic_flowyx.domain.entities.VideoShare;
import dev.skype.mic_flowyx.domain.repositories.VideoShareRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class JpaVideoShareRepository implements VideoShareRepository {

    private final SpringDataVideoShareRepository springDataRepo;

    public JpaVideoShareRepository(SpringDataVideoShareRepository springDataRepo) {
        this.springDataRepo = springDataRepo;
    }

    @Override
    public void save(VideoShare share) {
        springDataRepo.save(VideoShareJpaEntity.fromDomain(share));
    }

    @Override
    public void saveAll(List<VideoShare> shares) {
        springDataRepo.saveAll(shares.stream().map(VideoShareJpaEntity::fromDomain).toList());
    }

    @Override
    @Transactional
    public void delete(UUID videoId, UUID sharedWithUserId) {
        springDataRepo.deleteByVideoIdAndSharedWithUserId(videoId, sharedWithUserId);
    }

    @Override
    public List<VideoShare> findByVideoId(UUID videoId) {
        return springDataRepo.findByVideoId(videoId).stream()
                .map(VideoShareJpaEntity::toDomain)
                .toList();
    }

    @Override
    public List<UUID> findVideoIdsBySharedWithUserId(UUID userId) {
        return springDataRepo.findVideoIdsBySharedWithUserId(userId);
    }

    @Override
    public List<VideoShare> findBySharedWithUserId(UUID userId) {
        return springDataRepo.findBySharedWithUserId(userId).stream()
                .map(VideoShareJpaEntity::toDomain)
                .toList();
    }

    @Override
    public List<VideoShare> findBySharedByUserId(UUID ownerId) {
        return springDataRepo.findBySharedByUserId(ownerId).stream()
                .map(VideoShareJpaEntity::toDomain)
                .toList();
    }

    @Override
    public boolean exists(UUID videoId, UUID sharedWithUserId) {
        return springDataRepo.existsByVideoIdAndSharedWithUserId(videoId, sharedWithUserId);
    }

    @Override
    public int countByVideoId(UUID videoId) {
        return springDataRepo.countByVideoId(videoId);
    }

    @Override
    @Transactional
    public void markViewed(UUID videoId, UUID viewerId) {
        springDataRepo.markViewed(videoId, viewerId, OffsetDateTime.now());
    }
}
