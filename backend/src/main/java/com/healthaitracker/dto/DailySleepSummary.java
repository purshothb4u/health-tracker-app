package com.healthaitracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailySleepSummary(
        Long userProfileId,
        LocalDate sleepDate,
        Integer sessionCount,
        Long totalSleepMinutes,
        BigDecimal averageQuality,
        Long nightSleepMinutes,
        Long napMinutes
) {
}
