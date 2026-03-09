package dev.skypea.mic_flowyx.domain.exceptions;

import java.util.UUID;

public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(UUID id) {
        super("User with id " + id + " already exists");
    }
}
