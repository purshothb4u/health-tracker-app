package com.healthaitracker.dto;

import java.math.BigDecimal;

public record ParticipantProgressResponse(
        Long userProfileId,
        String profileName,
        Long currentValue,
        Long targetValue,
        String displayUnit,
        BigDecimal progressPercentage,
        Integer points,
        Boolean goalReached,
        boolean progressAvailable,
        String message
) {
}
