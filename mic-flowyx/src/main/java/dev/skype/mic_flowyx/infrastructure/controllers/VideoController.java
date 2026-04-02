package dev.skype.mic_flowyx.infrastructure.controllers;

import dev.skype.mic_flowyx.application.usecases.sharing.GetSharedVideosUseCase;
import dev.skype.mic_flowyx.application.usecases.video.*;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/videos")
public class VideoController {

    private final UploadVideoUseCase uploadVideoUseCase;
    private final GetVideosUseCase getVideosUseCase;
    private final GetVideoUseCase getVideoUseCase;
    private final UpdateVideoUseCase updateVideoUseCase;
    private final DeleteVideoUseCase deleteVideoUseCase;
    private final GetSharedVideosUseCase getSharedVideosUseCase;
    private final BulkDeleteVideosUseCase bulkDeleteVideosUseCase;
    private final BulkUpdateTagsUseCase bulkUpdateTagsUseCase;

    public VideoController(UploadVideoUseCase uploadVideoUseCase,
                           GetVideosUseCase getVideosUseCase,
                           GetVideoUseCase getVideoUseCase,
                           UpdateVideoUseCase updateVideoUseCase,
                           DeleteVideoUseCase deleteVideoUseCase,
                           GetSharedVideosUseCase getSharedVideosUseCase,
                           BulkDeleteVideosUseCase bulkDeleteVideosUseCase,
                           BulkUpdateTagsUseCase bulkUpdateTagsUseCase) {
        this.uploadVideoUseCase = uploadVideoUseCase;
        this.getVideosUseCase = getVideosUseCase;
        this.getVideoUseCase = getVideoUseCase;
        this.updateVideoUseCase = updateVideoUseCase;
        this.deleteVideoUseCase = deleteVideoUseCase;
        this.getSharedVideosUseCase = getSharedVideosUseCase;
        this.bulkDeleteVideosUseCase = bulkDeleteVideosUseCase;
        this.bulkUpdateTagsUseCase = bulkUpdateTagsUseCase;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoResponse> upload(
            @RequestParam("video") MultipartFile video,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestParam(value = "description", defaultValue = "") String description,
            @RequestParam(value = "tags", defaultValue = "") String tags,
            @AuthenticationPrincipal String userEmail
    ) throws IOException {
        List<String> tagList = parseTags(tags);

        UploadVideoCommand command = new UploadVideoCommand(
                userEmail,
                UUID.randomUUID(),
                description.trim(),
                tagList,
                video.getInputStream(),
                video.getSize(),
                video.getContentType() != null ? video.getContentType() : "video/mp4",
                video.getOriginalFilename(),
                thumbnail != null && !thumbnail.isEmpty() ? thumbnail.getInputStream() : null,
                thumbnail != null && !thumbnail.isEmpty() ? thumbnail.getSize() : 0L
        );

        Video saved = uploadVideoUseCase.execute(command);
        VideoWithUrls withUrls = getVideoUseCase.execute(saved.id(), userEmail);
        return ResponseEntity.ok(VideoResponse.fromDomain(withUrls));
    }

    @GetMapping
    public ResponseEntity<List<VideoResponse>> listVideos(
            @RequestParam(value = "tags", required = false) String tags,
            @AuthenticationPrincipal String userEmail
    ) {
        List<String> tagList = tags != null && !tags.isBlank() ? parseTags(tags) : List.of();
        List<VideoWithUrls> videos = getVideosUseCase.execute(userEmail, tagList);
        return ResponseEntity.ok(videos.stream().map(VideoResponse::fromDomain).toList());
    }

    @GetMapping("/shared")
    public ResponseEntity<List<VideoResponse>> listSharedWithMe(
            @AuthenticationPrincipal String userEmail
    ) {
        List<VideoWithUrls> videos = getSharedVideosUseCase.execute(userEmail);
        return ResponseEntity.ok(videos.stream().map(VideoResponse::fromDomain).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoResponse> getVideo(
            @PathVariable UUID id,
            @AuthenticationPrincipal String userEmail
    ) {
        VideoWithUrls video = getVideoUseCase.execute(id, userEmail);
        return ResponseEntity.ok(VideoResponse.fromDomain(video));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VideoResponse> updateVideo(
            @PathVariable UUID id,
            @RequestBody UpdateVideoRequest request,
            @AuthenticationPrincipal String userEmail
    ) {
        Video updated = updateVideoUseCase.execute(
                new UpdateVideoCommand(id, userEmail, request.description(), request.tags())
        );
        VideoWithUrls withUrls = getVideoUseCase.execute(updated.id(), userEmail);
        return ResponseEntity.ok(VideoResponse.fromDomain(withUrls));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVideo(
            @PathVariable UUID id,
            @AuthenticationPrincipal String userEmail
    ) {
        deleteVideoUseCase.execute(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<BulkDeleteResponse> bulkDelete(
            @RequestBody BulkDeleteRequest request,
            @AuthenticationPrincipal String userEmail
    ) {
        List<UUID> deleted = bulkDeleteVideosUseCase.execute(request.videoIds(), userEmail);
        return ResponseEntity.ok(new BulkDeleteResponse(deleted));
    }

    @PatchMapping("/bulk-tags")
    public ResponseEntity<List<VideoResponse>> bulkUpdateTags(
            @RequestBody BulkUpdateTagsRequest request,
            @AuthenticationPrincipal String userEmail
    ) {
        List<Video> updated = bulkUpdateTagsUseCase.execute(request.videoIds(), request.tags(), userEmail);
        List<VideoResponse> responses = updated.stream()
                .map(v -> getVideoUseCase.execute(v.id(), userEmail))
                .map(VideoResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(responses);
    }

    private List<String> parseTags(String tags) {
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }
}
