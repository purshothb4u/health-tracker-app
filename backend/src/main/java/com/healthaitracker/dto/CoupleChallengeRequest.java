package com.healthaitracker.dto;

import com.healthaitracker.entity.ChallengeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CoupleChallengeRequest(
        @NotBlank @Size(max = 100) String title,
        @NotNull ChallengeType challengeType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull @Positive Long targetValue,
        Integer qualifyingSleepMinutes,
        @Size(max = 30) String customUnit,
        @NotNull @Size(min = 2, max = 2) List<Long> participantUserProfileIds,
        @Size(max = 500) String notes
) {
}
