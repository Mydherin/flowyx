package dev.skype.mic_flowyx.infrastructure.controllers;

import dev.skype.mic_flowyx.application.usecases.user.SearchUsersUseCase;
import dev.skype.mic_flowyx.infrastructure.controllers.dto.UserSearchResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final SearchUsersUseCase searchUsersUseCase;

    public UserController(SearchUsersUseCase searchUsersUseCase) {
        this.searchUsersUseCase = searchUsersUseCase;
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> search(
            @RequestParam String q,
            @AuthenticationPrincipal String userEmail
    ) {
        List<UserSearchResponse> results = searchUsersUseCase.execute(q, userEmail)
                .stream()
                .map(UserSearchResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(results);
    }
}
