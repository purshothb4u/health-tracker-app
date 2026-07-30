package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HydrationSummary(
        LocalDate entryDate,
        Long totalConsumedMl,
        int entryCount,
        Integer currentDailyGoalMl,
        Long remainingAgainstCurrentGoalMl,
        Long excessAgainstCurrentGoalMl,
        BigDecimal progressAgainstCurrentGoalPercentage,
        Boolean goalReached
) {
}
