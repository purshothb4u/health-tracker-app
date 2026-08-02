package com.healthaitracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProgressCheckInRequest(
        @NotNull Boolean completed,
        @Size(max = 500) String notes
) {
}
