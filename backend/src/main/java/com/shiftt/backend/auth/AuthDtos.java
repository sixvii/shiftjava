package com.shiftt.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record SignupRequest(
            @NotBlank @Size(min = 3, max = 50) String username,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 128) String password
    ) {
    }

    public record LoginRequest(
            @NotBlank String usernameOrEmail,
            @NotBlank String password
    ) {
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            String userId,
            String username,
            String email
    ) {
    }

    public record RefreshRequest(
            @NotBlank String refreshToken
    ) {
    }

    public record LogoutRequest(
            @NotBlank String refreshToken
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank @Email String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6, max = 128) String password
    ) {
    }

    public record MessageResponse(
            String message
    ) {
    }
}
