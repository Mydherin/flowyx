package dev.skypea.mic_flowyx.infrastructure.controllers;

import dev.skypea.mic_flowyx.application.use_cases.FindOrCreateUserUseCase;
import dev.skypea.mic_flowyx.infrastructure.security.GoogleOAuthService;
import dev.skypea.mic_flowyx.infrastructure.security.GoogleTokenResponse;
import dev.skypea.mic_flowyx.infrastructure.security.GoogleUserInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final GoogleOAuthService googleOAuthService;
    private final FindOrCreateUserUseCase findOrCreateUserUseCase;

    @Getter
    @AllArgsConstructor
    public static class AuthResponse {
        private String idToken;
        private String accessToken;
        private Integer expiresIn;
    }

    @GetMapping("/google")
    public ResponseEntity<Void> initiateLogin() {
        String state = UUID.randomUUID().toString();
        String authUrl = googleOAuthService.buildAuthorizationUrl(state);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(authUrl)).build();
    }

    @GetMapping("/callback/google")
    public ResponseEntity<AuthResponse> handleCallback(
            @RequestParam String code,
            @RequestParam(required = false) String state) {
        GoogleTokenResponse tokens = googleOAuthService.exchangeCode(code);
        GoogleUserInfo userInfo = googleOAuthService.getUserInfo(tokens.getAccessToken());
        findOrCreateUserUseCase.run(
                new FindOrCreateUserUseCase.Command(userInfo.getId(), userInfo.getName(), userInfo.getEmail())
        );
        return ResponseEntity.ok(new AuthResponse(tokens.getIdToken(), tokens.getAccessToken(), tokens.getExpiresIn()));
    }
}
