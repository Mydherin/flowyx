package dev.skypea.mic_flowyx.domain.exceptions;

public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(String id) {
        super("User with id " + id + " already exists");
    }
}
