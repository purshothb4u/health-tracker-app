package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyNutritionSummary(
        Long userProfileId,
        LocalDate entryDate,
        BigDecimal totalCalories,
        BigDecimal totalProteinGrams,
        BigDecimal totalCarbohydrateGrams,
        BigDecimal totalFatGrams,
        BigDecimal maintenanceCalories,
        BigDecimal remainingCalories
) {
}
