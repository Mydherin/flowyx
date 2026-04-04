package dev.skype.mic_flowyx.application.ports;

import java.io.InputStream;

public interface StoragePort {
    void upload(String key, InputStream data, long size, String contentType);
    String getObjectUrl(String key);
    void delete(String key);

    /**
     * Downloads the resource at {@code sourceUrl}, uploads it under {@code key},
     * and returns the stored key. Returns {@code null} on any failure so callers
     * can fall back to the original URL.
     */
    String storeFromUrl(String key, String sourceUrl);
}
