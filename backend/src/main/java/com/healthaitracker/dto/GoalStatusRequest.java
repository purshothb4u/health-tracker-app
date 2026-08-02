package com.healthaitracker.dto;

import com.healthaitracker.entity.GoalStatus;
import jakarta.validation.constraints.NotNull;

public record GoalStatusRequest(@NotNull GoalStatus status) {
}
