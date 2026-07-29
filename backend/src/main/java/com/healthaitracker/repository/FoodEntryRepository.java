package com.healthaitracker.repository;

import com.healthaitracker.entity.FoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FoodEntryRepository extends JpaRepository<FoodEntry, Long> {

    boolean existsByNotesStartingWith(String notesPrefix);

    @Query("""
            SELECT foodEntry
            FROM FoodEntry foodEntry
            WHERE foodEntry.userProfile.id = :userProfileId
              AND foodEntry.entryDate = :entryDate
            ORDER BY CASE foodEntry.mealType
                WHEN com.healthaitracker.entity.MealType.BREAKFAST THEN 1
                WHEN com.healthaitracker.entity.MealType.LUNCH THEN 2
                WHEN com.healthaitracker.entity.MealType.DINNER THEN 3
                WHEN com.healthaitracker.entity.MealType.SNACK THEN 4
                ELSE 5
            END,
            foodEntry.createdAt,
            foodEntry.id
            """)
    List<FoodEntry> findByUserProfileIdAndEntryDateOrdered(
            @Param("userProfileId") Long userProfileId,
            @Param("entryDate") LocalDate entryDate
    );
}
