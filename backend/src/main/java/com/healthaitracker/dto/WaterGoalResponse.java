package com.healthaitracker.dto;

import java.time.LocalDateTime;

public record WaterGoalResponse(
        Long userProfileId,
        Integer dailyGoalMl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
