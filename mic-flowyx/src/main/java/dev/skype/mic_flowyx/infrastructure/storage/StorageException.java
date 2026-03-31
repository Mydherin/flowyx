package dev.skype.mic_flowyx.infrastructure.storage;

public class StorageException extends RuntimeException {
    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
