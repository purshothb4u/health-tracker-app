package com.healthaitracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record WaterGoalRequest(
        @NotNull @Positive Integer dailyGoalMl
) {
}
