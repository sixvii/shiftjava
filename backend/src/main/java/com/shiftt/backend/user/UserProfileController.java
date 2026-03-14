package com.shiftt.backend.user;

import com.shiftt.backend.auth.PasswordResetTokenRepository;
import com.shiftt.backend.auth.RefreshTokenRepository;
import com.shiftt.backend.expense.ExpenseRepository;
import com.shiftt.backend.job.JobRepository;
import com.shiftt.backend.shift.ShiftRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/me")
public class UserProfileController {

    private final CurrentUserService currentUserService;
    private final UserSettingsRepository userSettingsRepository;
    private final ShiftRepository shiftRepository;
    private final ExpenseRepository expenseRepository;
    private final JobRepository jobRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileController(
            CurrentUserService currentUserService,
            UserSettingsRepository userSettingsRepository,
            ShiftRepository shiftRepository,
            ExpenseRepository expenseRepository,
            JobRepository jobRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.currentUserService = currentUserService;
        this.userSettingsRepository = userSettingsRepository;
        this.shiftRepository = shiftRepository;
        this.expenseRepository = expenseRepository;
        this.jobRepository = jobRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public MeResponse me() {
        AppUser user = currentUserService.requireCurrentUser();
        UserSettings settings = ensureSettings(user);

        return new MeResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                SettingsResponse.fromEntity(settings)
        );
    }

    @PatchMapping("/settings")
    public SettingsResponse updateSettings(@Valid @RequestBody UpdateSettingsRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        UserSettings settings = ensureSettings(user);

        if (request.name() != null) {
            settings.setName(request.name().trim());
        }
        if (request.country() != null) {
            settings.setCountry(request.country().trim().toUpperCase());
        }
        if (request.taxRate() != null) {
            settings.setTaxRate(request.taxRate());
        }
        if (request.insuranceRate() != null) {
            settings.setInsuranceRate(request.insuranceRate());
        }
        if (request.otherDeductions() != null) {
            settings.setOtherDeductions(request.otherDeductions());
        }

        UserSettings saved = userSettingsRepository.save(settings);
        return SettingsResponse.fromEntity(saved);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
        AppUser user = currentUserService.requireCurrentUser();

        // Verify password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid password");
        }

        String userId = user.getId();
        refreshTokenRepository.deleteByUserId(userId);
        passwordResetTokenRepository.deleteByUserId(userId);
        shiftRepository.deleteAllByUserId(userId);
        expenseRepository.deleteAllByUserId(userId);
        jobRepository.deleteAllByUserId(userId);
        userSettingsRepository.deleteByUserId(userId);
        appUserRepository.deleteById(userId);
    }

    private UserSettings ensureSettings(AppUser user) {
        return userSettingsRepository.findByUserId(user.getId()).orElseGet(() -> {
            UserSettings settings = new UserSettings();
            settings.setUserId(user.getId());
            settings.setName(user.getUsername());
            settings.setCountry("US");
            settings.setTaxRate(BigDecimal.ZERO);
            settings.setInsuranceRate(BigDecimal.ZERO);
            settings.setOtherDeductions(BigDecimal.ZERO);
            return userSettingsRepository.save(settings);
        });
    }

    public record MeResponse(
            String id,
            String username,
            String email,
            SettingsResponse settings
    ) {
    }

    public record UpdateSettingsRequest(
            @Size(max = 100) String name,
            @Size(min = 2, max = 2) String country,
            @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal taxRate,
            @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal insuranceRate,
            @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal otherDeductions
    ) {
    }

    public record SettingsResponse(
            String name,
            String country,
            BigDecimal taxRate,
            BigDecimal insuranceRate,
            BigDecimal otherDeductions
    ) {
        static SettingsResponse fromEntity(UserSettings settings) {
            return new SettingsResponse(
                    settings.getName(),
                    settings.getCountry(),
                    settings.getTaxRate(),
                    settings.getInsuranceRate(),
                    settings.getOtherDeductions()
            );
        }
    }

    public record DeleteAccountRequest(
            @NotBlank String password
    ) {
    }
}
