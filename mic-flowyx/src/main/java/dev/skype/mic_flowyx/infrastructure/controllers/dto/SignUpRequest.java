package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SignUpRequest(
        @NotNull UUID uuid,
        @NotBlank String nickname,
        @Email @NotBlank String email,
        String picture
) {}
