package dev.skype.mic_flowyx.application.usecases.video;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.UUID;

@Service
public class UploadVideoChunkUseCase {

    private final StoragePort storagePort;

    public UploadVideoChunkUseCase(StoragePort storagePort) {
        this.storagePort = storagePort;
    }

    public void execute(UUID videoId, int chunkIndex, InputStream data, long size) {
        String chunkKey = "tmp/%s/chunk-%04d".formatted(videoId, chunkIndex);
        storagePort.upload(chunkKey, data, size, "application/octet-stream");
    }
}
