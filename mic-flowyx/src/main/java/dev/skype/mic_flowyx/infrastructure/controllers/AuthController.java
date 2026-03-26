package dev.skype.mic_flowyx.infrastructure.controllers;

import dev.skype.mic_flowyx.application.usecases.SignInCommand;
import dev.skype.mic_flowyx.application.usecases.SignInUseCase;
import dev.skype.mic_flowyx.application.usecases.SignUpCommand;
import dev.skype.mic_flowyx.application.usecases.SignUpUseCase;
import dev.skype.mic_flowyx.domain.entities.User;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.SignInRequest;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.SignUpRequest;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.SignUpResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final SignUpUseCase signUpUseCase;
    private final SignInUseCase signInUseCase;

    public AuthController(SignUpUseCase signUpUseCase, SignInUseCase signInUseCase) {
        this.signUpUseCase = signUpUseCase;
        this.signInUseCase = signInUseCase;
    }

    @PostMapping("/signup")
    public ResponseEntity<SignUpResponse> signUp(
            @Valid @RequestBody SignUpRequest request,
            @AuthenticationPrincipal String tokenEmail) {

        SignUpCommand command = new SignUpCommand(
                request.uuid(),
                request.nickname(),
                request.email(),
                request.picture(),
                tokenEmail
        );

        User user = signUpUseCase.execute(command);
        return ResponseEntity.ok(SignUpResponse.fromDomain(user));
    }

    @PostMapping("/signin")
    public ResponseEntity<SignUpResponse> signIn(
            @RequestBody(required = false) SignInRequest request,
            @AuthenticationPrincipal String tokenEmail) {

        String picture = request != null ? request.picture() : null;
        User user = signInUseCase.execute(new SignInCommand(tokenEmail, picture));
        return ResponseEntity.ok(SignUpResponse.fromDomain(user));
    }
}
