package com.healthaitracker.dto;

import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.ProfileGoalType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProfileOnboardingResponse(
        Long profileId,
        String displayName,
        Gender sex,
        LocalDate dateOfBirth,
        Integer age,
        BigDecimal heightCm,
        BigDecimal currentWeightKg,
        BigDecimal targetWeightKg,
        ActivityLevel activityLevel,
        ProfileGoalType goalType,
        boolean profileComplete,
        boolean hasWeightHistory
) {
}
