package com.healthaitracker.dto;

import com.healthaitracker.entity.ChallengeStatus;
import jakarta.validation.constraints.NotNull;

public record ChallengeStatusRequest(@NotNull ChallengeStatus status) {
}
