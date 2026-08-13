package com.healthaitracker.service;

import com.healthaitracker.dto.AnalyticsResponse;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.AnalyticsDateRangeException;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private HealthMetricRepository healthMetricRepository;

    @Mock
    private FoodEntryRepository foodEntryRepository;

    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsService(
                userProfileRepository,
                healthMetricRepository,
                foodEntryRepository,
                new HealthCalculationService(),
                new DailyTargetCalculationService(
                        userProfileRepository,
                        healthMetricRepository,
                        new HealthCalculationService()));
    }

    @Test
    void calculatesRangeScopedWeightAndLoggedDayNutritionAnalytics() {
        UserProfile profile = createProfile(Gender.MALE);
        LocalDate fromDate = LocalDate.now().minusDays(2);
        LocalDate toDate = LocalDate.now();
        HealthMetric firstMetric = createMetric(profile, fromDate, "80.00");
        HealthMetric lastMetric = createMetric(profile, toDate, "78.00");
        FoodEntry firstEntry = createFoodEntry(profile, fromDate, "300.00", "20.00", "30.00", "10.00");
        FoodEntry zeroNutritionEntry = createFoodEntry(profile, toDate, "0.00", "0.00", "0.00", "0.00");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(healthMetricRepository.findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(1L, fromDate, toDate))
                .thenReturn(List.of(firstMetric, lastMetric));
        when(foodEntryRepository.findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(1L, fromDate, toDate))
                .thenReturn(List.of(firstEntry, zeroNutritionEntry));
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L))
                .thenReturn(Optional.of(lastMetric));

        AnalyticsResponse response = analyticsService.getAnalytics(1L, fromDate, toDate);

        assertThat(response.weightAnalytics().firstWeightKgInRange()).isEqualByComparingTo("80.00");
        assertThat(response.weightAnalytics().lastWeightKgInRange()).isEqualByComparingTo("78.00");
        assertThat(response.weightAnalytics().weightChangeKg()).isEqualByComparingTo("-2.00");
        assertThat(response.weightAnalytics().weightChangePercentage()).isEqualByComparingTo("-2.50");
        assertThat(response.weightAnalytics().progressAtEndOfRangePercentage()).isEqualByComparingTo("60.00");
        assertThat(response.weightAnalytics().weightDataPoints()).extracting(dataPoint -> dataPoint.date())
                .containsExactly(fromDate, toDate);
        assertThat(response.nutritionAnalytics().totalDaysInRange()).isEqualTo(3);
        assertThat(response.nutritionAnalytics().daysWithFoodLogs()).isEqualTo(2);
        assertThat(response.nutritionAnalytics().daysWithoutFoodLogs()).isEqualTo(1);
        assertThat(response.nutritionAnalytics().totalCalories()).isEqualByComparingTo("300.00");
        assertThat(response.nutritionAnalytics().averageCaloriesPerLoggedDay()).isEqualByComparingTo("150.00");
        assertThat(response.nutritionAnalytics().dailyNutritionDataPoints().get(1).foodEntryCount()).isZero();
        assertThat(response.nutritionAnalytics().dailyNutritionDataPoints().get(1).totalCalories())
                .isEqualByComparingTo("0.00");
        assertThat(response.nutritionAnalytics().daysBelowMaintenance()).isEqualTo(2);
        assertThat(response.nutritionAnalytics().daysAtOrAboveMaintenance()).isZero();
    }

    @Test
    void returnsNullMetricDerivedValuesAndLoggedDayAveragesWhenNoDataExists() {
        UserProfile profile = createProfile(Gender.OTHER);
        LocalDate date = LocalDate.now();

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(healthMetricRepository.findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(1L, date, date))
                .thenReturn(List.of());
        when(foodEntryRepository.findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(1L, date, date))
                .thenReturn(List.of());
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L)).thenReturn(Optional.empty());

        AnalyticsResponse response = analyticsService.getAnalytics(1L, date, date);

        assertThat(response.weightAnalytics().firstWeightKgInRange()).isNull();
        assertThat(response.weightAnalytics().lastWeightKgInRange()).isNull();
        assertThat(response.weightAnalytics().progressAtEndOfRangePercentage()).isNull();
        assertThat(response.weightAnalytics().targetWeightKg()).isEqualByComparingTo("70.0");
        assertThat(response.nutritionAnalytics().averageCaloriesPerLoggedDay()).isNull();
        assertThat(response.nutritionAnalytics().currentMaintenanceCaloriesEstimate()).isNull();
        assertThat(response.nutritionAnalytics().daysBelowMaintenance()).isNull();
        assertThat(response.nutritionAnalytics().daysAtOrAboveMaintenance()).isNull();
    }

    @Test
    void returnsSingleRangeWeightWithoutWeightChangeValues() {
        UserProfile profile = createProfile(Gender.MALE);
        LocalDate date = LocalDate.now();
        HealthMetric metric = createMetric(profile, date, "82.50");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(healthMetricRepository.findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(1L, date, date))
                .thenReturn(List.of(metric));
        when(foodEntryRepository.findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(1L, date, date))
                .thenReturn(List.of());
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L)).thenReturn(Optional.empty());

        AnalyticsResponse response = analyticsService.getAnalytics(1L, date, date);

        assertThat(response.weightAnalytics().firstWeightKgInRange()).isEqualByComparingTo("82.50");
        assertThat(response.weightAnalytics().lastWeightKgInRange()).isEqualByComparingTo("82.50");
        assertThat(response.weightAnalytics().weightChangeKg()).isNull();
        assertThat(response.weightAnalytics().weightChangePercentage()).isNull();
        assertThat(response.weightAnalytics().lowestWeightKg()).isEqualByComparingTo("82.50");
        assertThat(response.weightAnalytics().highestWeightKg()).isEqualByComparingTo("82.50");
        assertThat(response.weightAnalytics().averageWeightKg()).isEqualByComparingTo("82.50");
        assertThat(response.weightAnalytics().recordedDays()).isEqualTo(1);
        assertThat(response.weightAnalytics().weightDataPoints()).hasSize(1);
    }

    @Test
    void calculatesDailyNutritionTotalsLoggedDayAveragesAndMaintenanceCounts() {
        UserProfile profile = createProfile(Gender.MALE);
        LocalDate fromDate = LocalDate.now().minusDays(2);
        LocalDate toDate = LocalDate.now();
        HealthMetric currentMetric = createMetric(profile, toDate, "80.00");
        FoodEntry firstDayBreakfast = createFoodEntry(profile, fromDate, "1000.00", "40.00", "120.00", "30.00");
        FoodEntry firstDayDinner = createFoodEntry(profile, fromDate, "1000.00", "30.00", "80.00", "20.00");
        FoodEntry secondDayLunch = createFoodEntry(profile, fromDate.plusDays(1), "2500.00", "60.00", "200.00", "70.00");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(healthMetricRepository.findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(1L, fromDate, toDate))
                .thenReturn(List.of(currentMetric));
        when(foodEntryRepository.findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(1L, fromDate, toDate))
                .thenReturn(List.of(firstDayBreakfast, firstDayDinner, secondDayLunch));
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L))
                .thenReturn(Optional.of(currentMetric));

        AnalyticsResponse response = analyticsService.getAnalytics(1L, fromDate, toDate);

        assertThat(response.nutritionAnalytics().totalCalories()).isEqualByComparingTo("4500.00");
        assertThat(response.nutritionAnalytics().averageCaloriesPerLoggedDay()).isEqualByComparingTo("2250.00");
        assertThat(response.nutritionAnalytics().averageProteinGramsPerLoggedDay()).isEqualByComparingTo("65.00");
        assertThat(response.nutritionAnalytics().averageCarbohydrateGramsPerLoggedDay()).isEqualByComparingTo("200.00");
        assertThat(response.nutritionAnalytics().averageFatGramsPerLoggedDay()).isEqualByComparingTo("60.00");
        assertThat(response.nutritionAnalytics().daysWithFoodLogs()).isEqualTo(2);
        assertThat(response.nutritionAnalytics().daysWithoutFoodLogs()).isEqualTo(1);
        assertThat(response.nutritionAnalytics().currentMaintenanceCaloriesEstimate()).isEqualByComparingTo("2099");
        assertThat(response.nutritionAnalytics().daysBelowMaintenance()).isEqualTo(1);
        assertThat(response.nutritionAnalytics().daysAtOrAboveMaintenance()).isEqualTo(1);
        assertThat(response.nutritionAnalytics().dailyNutritionDataPoints())
                .extracting(dataPoint -> dataPoint.date())
                .containsExactly(fromDate, fromDate.plusDays(1), toDate);
        assertThat(response.nutritionAnalytics().dailyNutritionDataPoints().get(0).foodEntryCount()).isEqualTo(2);
        assertThat(response.nutritionAnalytics().dailyNutritionDataPoints().get(2).foodEntryCount()).isZero();
        assertThat(response.nutritionAnalytics().dailyNutritionDataPoints().get(2).totalCalories())
                .isEqualByComparingTo("0.00");
    }

    @Test
    void validatesInclusiveMaximumDateRange() {
        LocalDate toDate = LocalDate.now();
        LocalDate validFromDate = toDate.minusDays(364);
        LocalDate invalidFromDate = toDate.minusDays(365);

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(Gender.MALE)));
        when(healthMetricRepository.findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(1L, validFromDate, toDate))
                .thenReturn(List.of());
        when(foodEntryRepository.findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(1L, validFromDate, toDate))
                .thenReturn(List.of());
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L)).thenReturn(Optional.empty());

        assertThat(analyticsService.getAnalytics(1L, validFromDate, toDate).weightAnalytics().totalDaysInRange())
                .isEqualTo(365);
        assertThatThrownBy(() -> analyticsService.getAnalytics(1L, invalidFromDate, toDate))
                .isInstanceOf(AnalyticsDateRangeException.class)
                .hasMessage("Analytics date range must not exceed 365 days");
    }

    private UserProfile createProfile(Gender gender) {
        UserProfile profile = new UserProfile();
        profile.setId(1L);
        profile.setName("Analytics profile");
        profile.setGender(gender);
        profile.setAge(30);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(90.0);
        profile.setCurrentWeightKg(85.0);
        profile.setTargetWeightKg(70.0);
        return profile;
    }

    private HealthMetric createMetric(UserProfile profile, LocalDate date, String weightKg) {
        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(profile);
        metric.setMetricDate(date);
        metric.setWeightKg(new BigDecimal(weightKg));
        return metric;
    }

    private FoodEntry createFoodEntry(
            UserProfile profile,
            LocalDate date,
            String calories,
            String proteinGrams,
            String carbohydrateGrams,
            String fatGrams) {
        FoodEntry entry = new FoodEntry();
        entry.setUserProfile(profile);
        entry.setEntryDate(date);
        entry.setCalories(new BigDecimal(calories));
        entry.setProteinG(new BigDecimal(proteinGrams));
        entry.setCarbohydratesG(new BigDecimal(carbohydrateGrams));
        entry.setFatG(new BigDecimal(fatGrams));
        return entry;
    }
}
