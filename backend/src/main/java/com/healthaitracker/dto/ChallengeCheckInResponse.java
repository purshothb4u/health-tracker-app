package com.healthaitracker.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ChallengeCheckInResponse(
        Long id,
        Long challengeId,
        Long participantUserProfileId,
        LocalDate checkInDate,
        boolean completed,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
