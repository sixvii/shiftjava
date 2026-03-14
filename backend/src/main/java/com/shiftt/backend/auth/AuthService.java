package com.shiftt.backend.auth;

import com.shiftt.backend.auth.AuthDtos.AuthResponse;
import com.shiftt.backend.auth.AuthDtos.ForgotPasswordRequest;
import com.shiftt.backend.auth.AuthDtos.LoginRequest;
import com.shiftt.backend.auth.AuthDtos.LogoutRequest;
import com.shiftt.backend.auth.AuthDtos.MessageResponse;
import com.shiftt.backend.auth.AuthDtos.RefreshRequest;
import com.shiftt.backend.auth.AuthDtos.ResetPasswordRequest;
import com.shiftt.backend.auth.AuthDtos.SignupRequest;
import com.shiftt.backend.config.JwtService;
import com.shiftt.backend.user.AppUser;
import com.shiftt.backend.user.AppUserRepository;
import com.shiftt.backend.user.UserSettings;
import com.shiftt.backend.user.UserSettingsRepository;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetEmailService passwordResetEmailService;

    public AuthService(
            AppUserRepository appUserRepository,
            UserSettingsRepository userSettingsRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordResetEmailService passwordResetEmailService
    ) {
        this.appUserRepository = appUserRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetEmailService = passwordResetEmailService;
    }

    public AuthResponse signup(SignupRequest request) {
        if (appUserRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (appUserRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser user = new AppUser();
        user.setUsername(request.username().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        AppUser saved = appUserRepository.save(user);
        createDefaultSettings(saved);
        return issueTokenPair(saved);
    }

    public AuthResponse login(LoginRequest request) {
        String credential = request.usernameOrEmail().trim();

        AppUser user = credential.contains("@")
                ? appUserRepository.findByEmail(credential.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"))
                : appUserRepository.findByUsername(credential)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return issueTokenPair(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        Claims claims = parseRefreshClaimsOrThrow(request.refreshToken());
        String tokenId = claims.getId();
        String userId = claims.get("uid", String.class);

        RefreshToken stored = refreshTokenRepository.findByTokenIdAndRevokedFalse(tokenId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (!stored.getUserId().equals(userId) || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        AppUser user = appUserRepository.findById(stored.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        return issueTokenPair(user);
    }

    public void logout(LogoutRequest request) {
        Claims claims;
        try {
            claims = jwtService.parseRefreshToken(request.refreshToken());
        } catch (Exception ex) {
            return;
        }

        if (claims.getId() == null) {
            return;
        }

        refreshTokenRepository.findByTokenId(claims.getId())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        appUserRepository.findByEmail(normalizedEmail)
                .ifPresent(user -> {
                    passwordResetTokenRepository.deleteByUserId(user.getId());

                    JwtService.PasswordResetTokenPayload payload = jwtService.generatePasswordResetToken(user.getId(), user.getUsername());

                    PasswordResetToken resetToken = new PasswordResetToken();
                    resetToken.setTokenId(payload.tokenId());
                    resetToken.setUserId(user.getId());
                    resetToken.setExpiresAt(payload.expiresAt());
                    resetToken.setUsed(false);
                    passwordResetTokenRepository.save(resetToken);

                    passwordResetEmailService.sendResetLink(user, payload.token());
                });

        return new MessageResponse("If an account exists for that email, a reset link has been sent.");
    }

    public MessageResponse resetPassword(ResetPasswordRequest request) {
        Claims claims = parsePasswordResetClaimsOrThrow(request.token());
        String tokenId = claims.getId();
        String userId = claims.get("uid", String.class);

        PasswordResetToken stored = passwordResetTokenRepository.findByTokenIdAndUsedFalse(tokenId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));

        if (!stored.getUserId().equals(userId) || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }

        AppUser user = appUserRepository.findById(stored.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        appUserRepository.save(user);

        stored.setUsed(true);
        passwordResetTokenRepository.save(stored);

        refreshTokenRepository.findAllByUserIdAndRevokedFalse(user.getId())
                .forEach(token -> token.setRevoked(true));

        return new MessageResponse("Your password has been reset successfully.");
    }

    private Claims parseRefreshClaimsOrThrow(String refreshToken) {
        try {
            return jwtService.parseRefreshToken(refreshToken);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
    }

    private Claims parsePasswordResetClaimsOrThrow(String token) {
        try {
            return jwtService.parsePasswordResetToken(token);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }
    }

    private AuthResponse issueTokenPair(AppUser user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());
        JwtService.RefreshTokenPayload refreshPayload = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenId(refreshPayload.tokenId());
        refreshToken.setUserId(user.getId());
        refreshToken.setExpiresAt(refreshPayload.expiresAt());
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshPayload.token(),
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getEmail()
        );
    }

    private void createDefaultSettings(AppUser user) {
        UserSettings settings = new UserSettings();
        settings.setUserId(user.getId());
        settings.setName(user.getUsername());
        settings.setCountry("US");
        settings.setTaxRate(BigDecimal.ZERO);
        settings.setInsuranceRate(BigDecimal.ZERO);
        settings.setOtherDeductions(BigDecimal.ZERO);
        userSettingsRepository.save(settings);
    }
}
