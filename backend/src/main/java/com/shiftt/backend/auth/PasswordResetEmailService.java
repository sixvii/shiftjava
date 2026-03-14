package com.shiftt.backend.auth;

import com.shiftt.backend.user.AppUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class PasswordResetEmailService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetEmailService.class);

    private final JavaMailSender mailSender;
    private final String frontendBaseUrl;
    private final String fromEmail;
    private final boolean mailLogOnly;

    public PasswordResetEmailService(
            JavaMailSender mailSender,
            @Value("${app.frontend.base-url}") String frontendBaseUrl,
            @Value("${app.password-reset.from-email}") String fromEmail,
            @Value("${app.password-reset.mail-log-only:false}") boolean mailLogOnly
    ) {
        this.mailSender = mailSender;
        this.frontendBaseUrl = frontendBaseUrl;
        this.fromEmail = fromEmail;
        this.mailLogOnly = mailLogOnly;
    }

    public void sendResetLink(AppUser user, String token) {
        String resetLink = buildResetLink(token);

        if (mailLogOnly) {
            log.info("Password reset link for {}: {}", user.getEmail(), resetLink);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom(fromEmail);
            message.setSubject("Reset your Shiftt password");
            message.setText(String.join("\n\n", List.of(
                    "We received a request to reset your Shiftt password.",
                    "Use the link below to choose a new password:",
                    resetLink,
                    "If you did not request this, you can ignore this email."
            )));
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}", user.getEmail(), ex);
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Unable to send reset email right now");
        }
    }

    private String buildResetLink(String token) {
        String baseUrl = frontendBaseUrl.endsWith("/") ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1) : frontendBaseUrl;
        return baseUrl + "/reset-password?token=" + token;
    }
}