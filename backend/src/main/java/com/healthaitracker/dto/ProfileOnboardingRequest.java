package com.healthaitracker.dto;

import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.ProfileGoalType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProfileOnboardingRequest(
        @NotBlank(message = "Display name is required")
        @Size(max = 100, message = "Display name must not exceed 100 characters")
        String displayName,
        @NotNull(message = "Sex is required") Gender sex,
        @NotNull(message = "Date of birth is required")
        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth,
        @NotNull(message = "Height is required")
        @Positive(message = "Height must be positive")
        BigDecimal heightCm,
        @NotNull(message = "Current weight is required")
        @Positive(message = "Current weight must be positive")
        @Digits(integer = 4, fraction = 2, message = "Current weight must use at most 4 whole digits and 2 decimal places")
        BigDecimal currentWeightKg,
        @NotNull(message = "Target weight is required")
        @Positive(message = "Target weight must be positive")
        BigDecimal targetWeightKg,
        @NotNull(message = "Activity level is required") ActivityLevel activityLevel,
        @NotNull(message = "Goal is required") ProfileGoalType goalType
) {
}
