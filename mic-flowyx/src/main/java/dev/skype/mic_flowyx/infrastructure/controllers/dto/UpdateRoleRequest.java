package dev.skype.mic_flowyx.infrastructure.controllers.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRoleRequest(
        @NotBlank String role
) {}
