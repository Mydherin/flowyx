package dev.skype.mic_flowyx.infrastructure.persistence;

import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.domain.repositories.VideoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaVideoRepository implements VideoRepository {

    private final SpringDataVideoRepository springDataRepo;

    public JpaVideoRepository(SpringDataVideoRepository springDataRepo) {
        this.springDataRepo = springDataRepo;
    }

    @Override
    public Video save(Video video) {
        return springDataRepo.save(VideoJpaEntity.fromDomain(video)).toDomain();
    }

    @Override
    public Optional<Video> findById(UUID id) {
        return springDataRepo.findById(id).map(VideoJpaEntity::toDomain);
    }

    @Override
    public List<Video> findByUserId(UUID userId, List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return springDataRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                    .map(VideoJpaEntity::toDomain)
                    .toList();
        }
        return springDataRepo.findByUserIdAndTagsIn(userId, tags).stream()
                .map(VideoJpaEntity::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public Video update(Video video) {
        return springDataRepo.save(VideoJpaEntity.fromDomain(video)).toDomain();
    }

    @Override
    public void delete(UUID id) {
        springDataRepo.deleteById(id);
    }
}
