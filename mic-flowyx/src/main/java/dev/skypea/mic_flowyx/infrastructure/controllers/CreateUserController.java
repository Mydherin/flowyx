package dev.skypea.mic_flowyx.infrastructure.controllers;

import dev.skypea.mic_flowyx.application.use_cases.CreateUserUseCase;
import dev.skypea.mic_flowyx.domain.entities.User;
import dev.skypea.mic_flowyx.domain.exceptions.UserAlreadyExistsException;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class CreateUserController {

    private final CreateUserUseCase createUserUseCase;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private UUID id;
        private String name;
        private String email;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody Request request) {
        User user = createUserUseCase.run(
                new CreateUserUseCase.Command(request.getId(), request.getName(), request.getEmail())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyExists(UserAlreadyExistsException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}
