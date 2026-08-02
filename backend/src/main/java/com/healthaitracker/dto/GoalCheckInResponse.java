package com.healthaitracker.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record GoalCheckInResponse(
        Long id,
        Long goalId,
        Long userProfileId,
        LocalDate checkInDate,
        boolean completed,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
