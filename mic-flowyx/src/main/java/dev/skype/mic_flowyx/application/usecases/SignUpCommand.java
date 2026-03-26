package dev.skype.mic_flowyx.application.usecases;

import java.util.UUID;

public record SignUpCommand(
        UUID uuid,
        String nickname,
        String email,
        String picture,
        String tokenEmail
) {}
