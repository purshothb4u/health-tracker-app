package com.healthaitracker.dto;

import com.healthaitracker.entity.GoalType;

import java.math.BigDecimal;

public record GoalProgressResponse(
        Long goalId,
        Long userProfileId,
        GoalType goalType,
        Long currentValue,
        Long targetValue,
        String displayUnit,
        BigDecimal progressPercentage,
        Integer points,
        Boolean goalReached,
        boolean progressAvailable,
        String message
) {
}
