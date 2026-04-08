package dev.skype.mic_flowyx.infrastructure.controllers;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.application.usecases.admin.*;
import dev.skype.mic_flowyx.application.usecases.video.VideoWithUrls;
import dev.skype.mic_flowyx.domain.entities.Role;
import dev.skype.mic_flowyx.domain.entities.Video;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.AdminUserResponse;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.ShareRecipientResponse;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.UpdateRoleRequest;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.UpdateVideoRequest;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.VideoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final GetAllUsersUseCase getAllUsersUseCase;
    private final UpdateUserRoleUseCase updateUserRoleUseCase;
    private final GetUserVideosAdminUseCase getUserVideosAdminUseCase;
    private final AssignVideoToUserUseCase assignVideoToUserUseCase;
    private final UpdateVideoAdminUseCase updateVideoAdminUseCase;
    private final GetShareRecipientsAdminUseCase getShareRecipientsAdminUseCase;
    private final StoragePort storagePort;

    public AdminController(GetAllUsersUseCase getAllUsersUseCase,
                           UpdateUserRoleUseCase updateUserRoleUseCase,
                           GetUserVideosAdminUseCase getUserVideosAdminUseCase,
                           AssignVideoToUserUseCase assignVideoToUserUseCase,
                           UpdateVideoAdminUseCase updateVideoAdminUseCase,
                           GetShareRecipientsAdminUseCase getShareRecipientsAdminUseCase,
                           StoragePort storagePort) {
        this.getAllUsersUseCase = getAllUsersUseCase;
        this.updateUserRoleUseCase = updateUserRoleUseCase;
        this.getUserVideosAdminUseCase = getUserVideosAdminUseCase;
        this.assignVideoToUserUseCase = assignVideoToUserUseCase;
        this.updateVideoAdminUseCase = updateVideoAdminUseCase;
        this.getShareRecipientsAdminUseCase = getShareRecipientsAdminUseCase;
        this.storagePort = storagePort;
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> listUsers() {
        List<AdminUserResponse> users = getAllUsersUseCase.execute().stream()
                .map(AdminUserResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserResponse> updateRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal String adminEmail) {
        Role newRole;
        try {
            newRole = Role.valueOf(request.role().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.role() + ". Allowed values: USER, ADMIN");
        }
        return ResponseEntity.ok(
                AdminUserResponse.fromDomain(updateUserRoleUseCase.execute(id, newRole, adminEmail))
        );
    }

    @GetMapping("/users/{id}/videos")
    public ResponseEntity<List<VideoResponse>> getUserVideos(
            @PathVariable UUID id,
            @RequestParam(value = "tags", required = false) String tags) {
        List<String> tagList = (tags != null && !tags.isBlank())
                ? Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList()
                : List.of();
        List<VideoResponse> videos = getUserVideosAdminUseCase.execute(id, tagList).stream()
                .map(VideoResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/users/{id}/share-recipients")
    public ResponseEntity<List<ShareRecipientResponse>> getShareRecipients(@PathVariable UUID id) {
        List<ShareRecipientResponse> recipients = getShareRecipientsAdminUseCase.execute(id)
                .stream()
                .map(ShareRecipientResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(recipients);
    }

    @PutMapping("/videos/{videoId}")
    public ResponseEntity<VideoResponse> updateVideo(
            @PathVariable UUID videoId,
            @RequestBody UpdateVideoRequest request) {
        Video updated = updateVideoAdminUseCase.execute(videoId, request.description(), request.tags());
        VideoWithUrls withUrls = new VideoWithUrls(
                updated,
                storagePort.getObjectUrl(updated.videoKey()),
                updated.thumbnailKey() != null ? storagePort.getObjectUrl(updated.thumbnailKey()) : null,
                0,
                true
        );
        return ResponseEntity.ok(VideoResponse.fromDomain(withUrls));
    }

    @PostMapping("/users/{targetUserId}/videos/{videoId}/assign")
    public ResponseEntity<VideoResponse> assignVideo(
            @PathVariable UUID targetUserId,
            @PathVariable UUID videoId) {
        Video assigned = assignVideoToUserUseCase.execute(videoId, targetUserId);
        VideoWithUrls withUrls = new VideoWithUrls(
                assigned,
                storagePort.getObjectUrl(assigned.videoKey()),
                assigned.thumbnailKey() != null ? storagePort.getObjectUrl(assigned.thumbnailKey()) : null,
                0,
                true
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(VideoResponse.fromDomain(withUrls));
    }
}
