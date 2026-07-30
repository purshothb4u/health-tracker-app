package com.healthaitracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record WaterEntryRequest(
        @NotNull @PastOrPresent LocalDate entryDate,
        @NotNull @Positive Integer amountMl,
        @Size(max = 500) String notes
) {
}
