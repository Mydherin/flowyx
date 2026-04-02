package dev.skype.mic_flowyx.infrastructure.controllers;

import dev.skype.mic_flowyx.application.usecases.sharing.GetVideoSharesUseCase;
import dev.skype.mic_flowyx.application.usecases.sharing.ShareVideosUseCase;
import dev.skype.mic_flowyx.application.usecases.sharing.UnshareVideoUseCase;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.BulkShareRequest;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.ShareVideosRequest;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.VideoShareResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/videos")
public class SharingController {

    private final ShareVideosUseCase shareVideosUseCase;
    private final UnshareVideoUseCase unshareVideoUseCase;
    private final GetVideoSharesUseCase getVideoSharesUseCase;

    public SharingController(ShareVideosUseCase shareVideosUseCase,
                              UnshareVideoUseCase unshareVideoUseCase,
                              GetVideoSharesUseCase getVideoSharesUseCase) {
        this.shareVideosUseCase = shareVideosUseCase;
        this.unshareVideoUseCase = unshareVideoUseCase;
        this.getVideoSharesUseCase = getVideoSharesUseCase;
    }

    @GetMapping("/{id}/shares")
    public ResponseEntity<List<VideoShareResponse>> getShares(
            @PathVariable UUID id,
            @AuthenticationPrincipal String userEmail
    ) {
        List<VideoShareResponse> shares = getVideoSharesUseCase.execute(id, userEmail)
                .stream()
                .map(VideoShareResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(shares);
    }

    @PostMapping("/{id}/shares")
    public ResponseEntity<Void> shareVideo(
            @PathVariable UUID id,
            @RequestBody ShareVideosRequest request,
            @AuthenticationPrincipal String userEmail
    ) {
        shareVideosUseCase.execute(List.of(id), request.userIds(), userEmail);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/shares/{userId}")
    public ResponseEntity<Void> removeShare(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @AuthenticationPrincipal String userEmail
    ) {
        unshareVideoUseCase.execute(id, userId, userEmail);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-share")
    public ResponseEntity<Void> bulkShare(
            @RequestBody BulkShareRequest request,
            @AuthenticationPrincipal String userEmail
    ) {
        shareVideosUseCase.execute(request.videoIds(), request.userIds(), userEmail);
        return ResponseEntity.noContent().build();
    }
}
