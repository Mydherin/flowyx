package dev.skype.mic_flowyx.application.ports;

import java.io.InputStream;

public interface StoragePort {
    void upload(String key, InputStream data, long size, String contentType);
    String getObjectUrl(String key);
    void delete(String key);
}
