package com.healthaitracker.dto;

import com.healthaitracker.entity.SleepType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SleepEntryRequest(
        @NotNull LocalDate sleepDate,
        @NotNull SleepType sleepType,
        @NotNull LocalDateTime startDateTime,
        @NotNull LocalDateTime endDateTime,
        @Min(1) @Max(5) Integer qualityRating,
        @Size(max = 500) String notes
) {
}
