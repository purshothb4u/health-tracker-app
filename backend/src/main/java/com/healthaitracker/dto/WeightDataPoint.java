package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record WeightDataPoint(
        LocalDate date,
        BigDecimal weightKg
) {
}
