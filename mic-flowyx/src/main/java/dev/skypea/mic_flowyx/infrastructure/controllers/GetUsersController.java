package dev.skypea.mic_flowyx.infrastructure.controllers;

import dev.skypea.mic_flowyx.application.use_cases.GetUsersUseCase;
import dev.skypea.mic_flowyx.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GetUsersController {

    private final GetUsersUseCase getUsersUseCase;

    @GetMapping
    public ResponseEntity<List<User>> getUsers() {
        List<User> users = getUsersUseCase.run();
        return ResponseEntity.ok(users);
    }
}
