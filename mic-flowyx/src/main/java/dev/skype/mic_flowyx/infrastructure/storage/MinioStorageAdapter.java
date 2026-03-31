package dev.skype.mic_flowyx.infrastructure.storage;

import dev.skype.mic_flowyx.application.ports.StoragePort;
import dev.skype.mic_flowyx.infrastructure.config.MinioProperties;
import io.minio.*;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
public class MinioStorageAdapter implements StoragePort {

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
