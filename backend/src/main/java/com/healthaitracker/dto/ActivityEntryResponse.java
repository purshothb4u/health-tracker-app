package com.healthaitracker.dto;

import com.healthaitracker.entity.ActivityCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ActivityEntryResponse(
        Long id,
        Long userProfileId,
        LocalDate activityDate,
        ActivityCategory category,
        String activityName,
        Integer durationMinutes,
        Integer steps,
        BigDecimal distanceKm,
        Integer reportedCaloriesBurned,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
