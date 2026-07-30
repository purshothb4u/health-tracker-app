package com.healthaitracker.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record WaterEntryResponse(
        Long id,
        Long userProfileId,
        LocalDate entryDate,
        Integer amountMl,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
