package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.util.List;

public record WeightAnalytics(
        BigDecimal firstWeightKgInRange,
        BigDecimal lastWeightKgInRange,
        BigDecimal weightChangeKg,
        BigDecimal weightChangePercentage,
        BigDecimal lowestWeightKg,
        BigDecimal highestWeightKg,
        BigDecimal averageWeightKg,
        BigDecimal targetWeightKg,
        BigDecimal remainingWeightKg,
        BigDecimal progressAtEndOfRangePercentage,
        int recordedDays,
        int totalDaysInRange,
        List<WeightDataPoint> weightDataPoints
) {
}
