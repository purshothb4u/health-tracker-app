package com.healthaitracker.service;

import java.math.BigDecimal;

public record ProgressCalculationResult(
        Long currentValue,
        Long targetValue,
        BigDecimal progressPercentage,
        Boolean goalReached,
        boolean progressAvailable,
        String displayUnit,
        String message
) {
}
