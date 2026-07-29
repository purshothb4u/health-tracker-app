package com.healthaitracker.dto;

import com.healthaitracker.entity.MealType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FoodEntryRequest(
        @NotNull @PastOrPresent LocalDate entryDate,
        @NotNull MealType mealType,
        @NotBlank @Size(max = 150) String foodName,
        @NotNull @Positive BigDecimal quantity,
        @NotBlank @Size(max = 50) String unit,
        @NotNull @DecimalMin(value = "0.0") BigDecimal calories,
        @NotNull @DecimalMin(value = "0.0") BigDecimal proteinGrams,
        @NotNull @DecimalMin(value = "0.0") BigDecimal carbohydrateGrams,
        @NotNull @DecimalMin(value = "0.0") BigDecimal fatGrams,
        @Size(max = 500) String notes
) {
}
