package com.healthaitracker.dto;

import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.MealType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record FoodEntryResponse(
        Long id,
        Long userProfileId,
        LocalDate entryDate,
        MealType mealType,
        String foodName,
        BigDecimal quantity,
        String unit,
        BigDecimal calories,
        BigDecimal proteinGrams,
        BigDecimal carbohydrateGrams,
        BigDecimal fatGrams,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static FoodEntryResponse fromEntity(FoodEntry foodEntry) {
        return new FoodEntryResponse(
                foodEntry.getId(),
                foodEntry.getUserProfile().getId(),
                foodEntry.getEntryDate(),
                foodEntry.getMealType(),
                foodEntry.getFoodName(),
                foodEntry.getQuantity(),
                foodEntry.getUnit(),
                foodEntry.getCalories(),
                foodEntry.getProteinG(),
                foodEntry.getCarbohydratesG(),
                foodEntry.getFatG(),
                foodEntry.getNotes(),
                foodEntry.getCreatedAt(),
                foodEntry.getUpdatedAt()
        );
    }
}
