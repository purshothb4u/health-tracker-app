package com.healthaitracker.dto;

import com.healthaitracker.entity.Gender;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UserProfileRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull Gender gender,
        @NotNull @Min(1) @Max(150) Integer age,
        @NotNull @Positive Double heightCm,
        @NotNull @Positive Double startingWeightKg,
        @NotNull @Positive Double currentWeightKg,
        @NotNull @Positive Double targetWeightKg
) {
}
