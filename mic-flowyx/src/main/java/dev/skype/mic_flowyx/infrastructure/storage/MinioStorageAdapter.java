package dev.skype.mic_flowyx.infrastructure.storage;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.infrastructure.config.MinioProperties;
import io.minio.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;

@Service
public class MinioStorageAdapter implements StoragePort {

    private static final Logger log = LoggerFactory.getLogger(MinioStorageAdapter.class);

    private final MinioClient minioClient;
    private final MinioProperties properties;

    public MinioStorageAdapter(MinioClient minioClient, MinioProperties properties) {
        this.minioClient = minioClient;
        this.properties = properties;
    }

    @Override
    public void upload(String key, InputStream data, long size, String contentType) {
        try {
            ensureBucketExists();
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(properties.bucket())
                    .object(key)
                    .stream(data, size, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to upload: " + key, e);
        }
    }

    @Override
    public String getObjectUrl(String key) {
        return "/media/" + key;
    }

    @Override
    public void delete(String key) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(properties.bucket())
                    .object(key)
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to delete: " + key, e);
        }
    }

    @Override
    public String storeFromUrl(String key, String sourceUrl) {
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(sourceUrl).toURL().openConnection();
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(8000);
            conn.connect();
            String contentType = conn.getContentType();
            if (contentType == null) contentType = "image/jpeg";
            int semi = contentType.indexOf(';');
            if (semi != -1) contentType = contentType.substring(0, semi).trim();
            try (InputStream is = conn.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                upload(key, new ByteArrayInputStream(bytes), bytes.length, contentType);
            }
            return key;
        } catch (Exception e) {
            log.warn("Failed to store resource from URL '{}' under key '{}': {}", sourceUrl, key, e.getMessage());
            return null;
        }
    }

    @Override
    public InputStream getObject(String key) {
        try {
            return minioClient.getObject(GetObjectArgs.builder()
                    .bucket(properties.bucket())
                    .object(key)
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to get object: " + key, e);
        }
    }

    private void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(properties.bucket()).build()
        );
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(properties.bucket()).build());
            String policy = """
                    {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}
                    """.formatted(properties.bucket());
            minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                    .bucket(properties.bucket())
                    .config(policy)
                    .build());
        }
    }
}
