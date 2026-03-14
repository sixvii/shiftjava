package com.shiftt.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey accessSecretKey;
    private final SecretKey refreshSecretKey;
    private final SecretKey passwordResetSecretKey;
    private final long accessExpirationMillis;
    private final long refreshExpirationMillis;
    private final long passwordResetExpirationMillis;

    public JwtService(
            @Value("${app.jwt.access-secret:${app.jwt.secret}}") String accessSecret,
            @Value("${app.jwt.refresh-secret:${app.jwt.secret}}") String refreshSecret,
            @Value("${app.jwt.password-reset-secret:${app.jwt.secret}}") String passwordResetSecret,
            @Value("${app.jwt.access-expiration-ms:900000}") long accessExpirationMillis,
            @Value("${app.jwt.refresh-expiration-ms:2592000000}") long refreshExpirationMillis,
            @Value("${app.jwt.password-reset-expiration-ms:3600000}") long passwordResetExpirationMillis
    ) {
        this.accessSecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessSecret));
        this.refreshSecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshSecret));
        this.passwordResetSecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(passwordResetSecret));
        this.accessExpirationMillis = accessExpirationMillis;
        this.refreshExpirationMillis = refreshExpirationMillis;
        this.passwordResetExpirationMillis = passwordResetExpirationMillis;
    }

    public String generateAccessToken(String userId, String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .claim("uid", userId)
                .claim("typ", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessExpirationMillis)))
                .signWith(accessSecretKey)
                .compact();
    }

    public RefreshTokenPayload generateRefreshToken(String userId, String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(refreshExpirationMillis);
        String tokenId = UUID.randomUUID().toString();

        String token = Jwts.builder()
                .id(tokenId)
                .subject(username)
                .claim("uid", userId)
                .claim("typ", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(refreshSecretKey)
                .compact();

        return new RefreshTokenPayload(token, tokenId, expiresAt);
    }

    public PasswordResetTokenPayload generatePasswordResetToken(String userId, String username) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(passwordResetExpirationMillis);
        String tokenId = UUID.randomUUID().toString();

        String token = Jwts.builder()
                .id(tokenId)
                .subject(username)
                .claim("uid", userId)
                .claim("typ", "password-reset")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(passwordResetSecretKey)
                .compact();

        return new PasswordResetTokenPayload(token, tokenId, expiresAt);
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(accessSecretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parser()
                .verifyWith(refreshSecretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims parsePasswordResetToken(String token) {
        return Jwts.parser()
                .verifyWith(passwordResetSecretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public record RefreshTokenPayload(String token, String tokenId, Instant expiresAt) {
    }

    public record PasswordResetTokenPayload(String token, String tokenId, Instant expiresAt) {
    }
}
