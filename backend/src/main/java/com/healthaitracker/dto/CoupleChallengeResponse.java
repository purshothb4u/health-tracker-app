package com.healthaitracker.dto;

import com.healthaitracker.entity.ChallengeStatus;
import com.healthaitracker.entity.ChallengeType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CoupleChallengeResponse(
        Long id,
        String title,
        ChallengeType challengeType,
        LocalDate startDate,
        LocalDate endDate,
        Long targetValue,
        Integer qualifyingSleepMinutes,
        String customUnit,
        String displayUnit,
        ChallengeStatus status,
        List<CoupleChallengeParticipantResponse> participants,
        String notes,
        LocalDateTime completedAt,
        LocalDateTime cancelledAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
