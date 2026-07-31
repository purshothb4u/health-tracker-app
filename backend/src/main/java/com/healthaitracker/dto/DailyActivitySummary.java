package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyActivitySummary(
        Long userProfileId,
        LocalDate activityDate,
        Integer activityCount,
        Long totalDurationMinutes,
        Long reportedSteps,
        BigDecimal reportedDistanceKm,
        Long reportedCaloriesBurned
) {
}
