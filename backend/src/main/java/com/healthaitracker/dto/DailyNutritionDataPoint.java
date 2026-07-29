package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyNutritionDataPoint(
        LocalDate date,
        BigDecimal totalCalories,
        BigDecimal totalProteinGrams,
        BigDecimal totalCarbohydrateGrams,
        BigDecimal totalFatGrams,
        int foodEntryCount
) {
}
