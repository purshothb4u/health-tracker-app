package com.healthaitracker.dto;

import com.healthaitracker.entity.GoalType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record GoalRequest(
        @NotBlank @Size(max = 100) String title,
        @NotNull GoalType goalType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull @Positive Long targetValue,
        Integer qualifyingSleepMinutes,
        @Size(max = 30) String customUnit,
        @Size(max = 500) String notes
) {
}
