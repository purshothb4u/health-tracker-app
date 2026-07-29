package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.util.List;

public record NutritionAnalytics(
        BigDecimal totalCalories,
        BigDecimal averageCaloriesPerLoggedDay,
        BigDecimal averageProteinGramsPerLoggedDay,
        BigDecimal averageCarbohydrateGramsPerLoggedDay,
        BigDecimal averageFatGramsPerLoggedDay,
        int totalDaysInRange,
        int daysWithFoodLogs,
        int daysWithoutFoodLogs,
        BigDecimal currentMaintenanceCaloriesEstimate,
        Integer daysBelowMaintenance,
        Integer daysAtOrAboveMaintenance,
        List<DailyNutritionDataPoint> dailyNutritionDataPoints
) {
}
