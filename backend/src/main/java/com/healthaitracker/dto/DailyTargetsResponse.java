package com.healthaitracker.dto;

import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.ProfileGoalType;

import java.math.BigDecimal;

public record DailyTargetsResponse(
        Integer age,
        BigDecimal currentWeightKg,
        ActivityLevel activityLevel,
        boolean usedLegacyActivityFallback,
        ProfileGoalType goalType,
        boolean adultEligible,
        BigDecimal bmrKcal,
        BigDecimal estimatedMaintenanceKcal,
        BigDecimal estimatedCalorieTargetKcal,
        BigDecimal proteinTargetG,
        BigDecimal carbohydrateTargetG,
        BigDecimal fatTargetG,
        Integer estimatedHydrationMl,
        boolean calorieTargetsAvailable,
        String calorieTargetsUnavailableReason,
        boolean hydrationEstimateAvailable,
        String hydrationEstimateUnavailableReason
) {
}
