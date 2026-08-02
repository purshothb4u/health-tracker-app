package com.healthaitracker.dto;

import com.healthaitracker.entity.GoalStatus;
import com.healthaitracker.entity.GoalType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GoalResponse(
        Long id,
        Long userProfileId,
        String title,
        GoalType goalType,
        LocalDate startDate,
        LocalDate endDate,
        Long targetValue,
        Integer qualifyingSleepMinutes,
        String customUnit,
        String displayUnit,
        GoalStatus status,
        String notes,
        LocalDateTime completedAt,
        LocalDateTime cancelledAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
