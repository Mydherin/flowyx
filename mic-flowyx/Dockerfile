# ── Stage 1: Build ───────────────────────────────────────────
FROM eclipse-temurin:25-jdk AS builder

WORKDIR /app

# Copy Maven wrapper and POM first — dependency layer cached until pom.xml changes
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source and build the fat JAR (skip tests — run them in CI)
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Extract Spring Boot layers for optimised Docker layer caching
RUN java -Djarmode=layertools -jar target/*.jar extract

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:25-jre AS runtime

# Non-root user for security hardening
RUN groupadd -g 1001 spring && useradd -u 1001 -g spring -m spring

WORKDIR /app

# Copy layertools-extracted layers least→most volatile.
# "dependencies" is largest and rarely changes — it stays cached.
COPY --from=builder --chown=spring:spring /app/dependencies/ ./
COPY --from=builder --chown=spring:spring /app/spring-boot-loader/ ./
COPY --from=builder --chown=spring:spring /app/snapshot-dependencies/ ./
COPY --from=builder --chown=spring:spring /app/application/ ./

USER spring

EXPOSE 8080

# Respect Docker memory limits; leave 25% headroom for the OS
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
