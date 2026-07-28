package com.healthaitracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HealthMetricRequest(
        @NotNull @PastOrPresent LocalDate metricDate,
        @NotNull @Positive BigDecimal weightKg,
        @Size(max = 500) String notes
) {
}
