package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HealthSummary(
        Long userProfileId,
        BigDecimal latestWeightKg,
        LocalDate latestMetricDate,
        BigDecimal bmi,
        BigDecimal bmrCaloriesPerDay,
        BigDecimal maintenanceCaloriesPerDay,
        BigDecimal weightLostKg,
        BigDecimal weightRemainingKg,
        BigDecimal goalProgressPercent
) {
}
