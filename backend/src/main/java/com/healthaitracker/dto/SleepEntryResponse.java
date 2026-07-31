package com.healthaitracker.dto;

import com.healthaitracker.entity.SleepType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SleepEntryResponse(
        Long id,
        Long userProfileId,
        LocalDate sleepDate,
        SleepType sleepType,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        Long durationMinutes,
        Integer qualityRating,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
