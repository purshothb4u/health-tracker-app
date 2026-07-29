package com.healthaitracker.dto;

import java.time.LocalDate;

public record AnalyticsResponse(
        Long userProfileId,
        LocalDate fromDate,
        LocalDate toDate,
        WeightAnalytics weightAnalytics,
        NutritionAnalytics nutritionAnalytics
) {
}
