package dev.skype.mic_flowyx.application.usecases;

public record SignInCommand(
        String email,
        String picture
) {}
