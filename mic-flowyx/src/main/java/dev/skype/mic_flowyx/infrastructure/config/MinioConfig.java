package dev.skype.mic_flowyx.infrastructure.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MinioProperties.class)
public class MinioConfig {

    private static final Logger log = LoggerFactory.getLogger(MinioConfig.class);

    @Bean
    public MinioClient minioClient(MinioProperties properties) {
        MinioClient client = MinioClient.builder()
                .endpoint(properties.endpoint())
                .credentials(properties.accessKey(), properties.secretKey())
                .build();

        try {
            boolean exists = client.bucketExists(
                    BucketExistsArgs.builder().bucket(properties.bucket()).build()
            );
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(properties.bucket()).build());
                log.info("Created MinIO bucket: {}", properties.bucket());
            }
        } catch (Exception e) {
            log.warn("MinIO bucket initialization skipped: {}. Bucket will be created on first upload.", e.getMessage());
        }

        return client;
    }
}
