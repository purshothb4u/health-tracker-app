package com.healthaitracker.dto;

import com.healthaitracker.entity.ActivityCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ActivityEntryRequest(
        @NotNull @PastOrPresent LocalDate activityDate,
        @NotNull ActivityCategory category,
        @NotBlank @Size(max = 100) String activityName,
        @NotNull @Min(1) @Max(1440) Integer durationMinutes,
        @Min(0) @Max(1_000_000) Integer steps,
        @DecimalMin("0.000") @DecimalMax("10000.000") @Digits(integer = 7, fraction = 3) BigDecimal distanceKm,
        @Min(0) @Max(100_000) Integer reportedCaloriesBurned,
        @Size(max = 500) String notes
) {
}
