package com.healthaitracker.service;

import com.healthaitracker.dto.DailyNutritionSummary;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.MealType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FoodEntryServiceTest {

    @Mock
    private FoodEntryRepository foodEntryRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private HealthMetricRepository healthMetricRepository;

    private FoodEntryService foodEntryService;

    @BeforeEach
    void setUp() {
        foodEntryService = new FoodEntryService(
                foodEntryRepository,
                userProfileRepository,
                healthMetricRepository,
                new HealthCalculationService());
    }

    @Test
    void calculatesDailyTotalsAndUsesLatestHealthMetricForMaintenanceCalories() {
        UserProfile profile = createProfile(1L, Gender.MALE, 90.0);
        HealthMetric latestMetric = createMetric(profile, 10L, "80.00");
        LocalDate entryDate = LocalDate.now();
        List<FoodEntry> entries = List.of(
                createFoodEntry(profile, 1L, entryDate, MealType.BREAKFAST,
                        "Oats", "350.00", "20.00", "40.00", "10.00"),
                createFoodEntry(profile, 2L, entryDate, MealType.SNACK,
                        "Yogurt", "200.00", "5.00", "30.00", "5.00")
        );

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(foodEntryRepository.findByUserProfileIdAndEntryDateOrdered(1L, entryDate)).thenReturn(entries);
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L))
                .thenReturn(Optional.of(latestMetric));

        DailyNutritionSummary summary = foodEntryService.getDailyNutritionSummary(1L, entryDate);

        assertThat(summary.totalCalories()).isEqualByComparingTo("550.00");
        assertThat(summary.totalProteinGrams()).isEqualByComparingTo("25.00");
        assertThat(summary.totalCarbohydrateGrams()).isEqualByComparingTo("70.00");
        assertThat(summary.totalFatGrams()).isEqualByComparingTo("15.00");
        assertThat(summary.maintenanceCalories()).isEqualByComparingTo("2099");
        assertThat(summary.remainingCalories()).isEqualByComparingTo("1549.00");
    }

    @Test
    void returnsNullMaintenanceAndRemainingCaloriesWhenGenderDoesNotSupportBmrCalculation() {
        UserProfile profile = createProfile(1L, Gender.OTHER, 70.0);
        LocalDate entryDate = LocalDate.now();

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(foodEntryRepository.findByUserProfileIdAndEntryDateOrdered(1L, entryDate)).thenReturn(List.of());
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L))
                .thenReturn(Optional.empty());

        DailyNutritionSummary summary = foodEntryService.getDailyNutritionSummary(1L, entryDate);

        assertThat(summary.totalCalories()).isEqualByComparingTo("0.00");
        assertThat(summary.maintenanceCalories()).isNull();
        assertThat(summary.remainingCalories()).isNull();
    }

    private UserProfile createProfile(Long id, Gender gender, double currentWeightKg) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setName("Test profile");
        profile.setGender(gender);
        profile.setAge(30);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(currentWeightKg);
        profile.setCurrentWeightKg(currentWeightKg);
        profile.setTargetWeightKg(70.0);
        return profile;
    }

    private HealthMetric createMetric(UserProfile profile, Long id, String weightKg) {
        HealthMetric metric = new HealthMetric();
        metric.setId(id);
        metric.setUserProfile(profile);
        metric.setMetricDate(LocalDate.now());
        metric.setWeightKg(new BigDecimal(weightKg));
        return metric;
    }

    private FoodEntry createFoodEntry(
            UserProfile profile,
            Long id,
            LocalDate entryDate,
            MealType mealType,
            String foodName,
            String calories,
            String proteinG,
            String carbohydratesG,
            String fatG) {
        FoodEntry foodEntry = new FoodEntry();
        foodEntry.setId(id);
        foodEntry.setUserProfile(profile);
        foodEntry.setEntryDate(entryDate);
        foodEntry.setMealType(mealType);
        foodEntry.setFoodName(foodName);
        foodEntry.setQuantity(new BigDecimal("1.00"));
        foodEntry.setUnit("serving");
        foodEntry.setCalories(new BigDecimal(calories));
        foodEntry.setProteinG(new BigDecimal(proteinG));
        foodEntry.setCarbohydratesG(new BigDecimal(carbohydratesG));
        foodEntry.setFatG(new BigDecimal(fatG));
        return foodEntry;
    }
}
