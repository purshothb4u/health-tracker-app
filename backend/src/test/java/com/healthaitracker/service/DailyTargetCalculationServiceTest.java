package com.healthaitracker.service;

import com.healthaitracker.dto.DailyTargetsResponse;
import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.ProfileGoalType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyTargetCalculationServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private HealthMetricRepository healthMetricRepository;

    private DailyTargetCalculationService dailyTargetCalculationService;

    @BeforeEach
    void setUp() {
        dailyTargetCalculationService = new DailyTargetCalculationService(
                userProfileRepository,
                healthMetricRepository,
                new HealthCalculationService());
    }

    @Test
    void usesDateOfBirthAndLatestHealthMetricForAdultDailyTargets() {
        UserProfile profile = profile(1L, Gender.MALE, 44, 90.0);
        profile.setDateOfBirth(LocalDate.now().minusYears(30));
        profile.setActivityLevel(ActivityLevel.MODERATELY_ACTIVE);
        profile.setGoalType(ProfileGoalType.LOSE_WEIGHT);
        HealthMetric latestMetric = metric(profile, "80.00");
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L))
                .thenReturn(Optional.of(latestMetric));

        DailyTargetsResponse response = dailyTargetCalculationService.calculateForProfile(profile);

        assertThat(response.age()).isEqualTo(30);
        assertThat(response.currentWeightKg()).isEqualByComparingTo("80.00");
        assertThat(response.activityLevel()).isEqualTo(ActivityLevel.MODERATELY_ACTIVE);
        assertThat(response.usedLegacyActivityFallback()).isFalse();
        assertThat(response.goalType()).isEqualTo(ProfileGoalType.LOSE_WEIGHT);
        assertThat(response.adultEligible()).isTrue();
        assertThat(response.bmrKcal()).isEqualByComparingTo("1749");
        assertThat(response.estimatedMaintenanceKcal()).isEqualByComparingTo("2711");
        assertThat(response.estimatedCalorieTargetKcal()).isEqualByComparingTo("2440");
        assertThat(response.proteinTargetG()).isEqualByComparingTo("152.5");
        assertThat(response.carbohydrateTargetG()).isEqualByComparingTo("274.5");
        assertThat(response.fatTargetG()).isEqualByComparingTo("81.3");
        assertThat(response.estimatedHydrationMl()).isEqualTo(3000);
        assertThat(response.calorieTargetsAvailable()).isTrue();
        assertThat(response.hydrationEstimateAvailable()).isTrue();
    }

    @Test
    void usesLegacyAgeCurrentWeightAndSedentaryFallbackWhenNewFieldsAreMissing() {
        UserProfile profile = profile(2L, Gender.FEMALE, 40, 70.0);
        profile.setGoalType(ProfileGoalType.MAINTAIN_WEIGHT);
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(2L))
                .thenReturn(Optional.empty());

        DailyTargetsResponse response = dailyTargetCalculationService.calculateForProfile(profile);

        assertThat(response.age()).isEqualTo(40);
        assertThat(response.currentWeightKg()).isEqualByComparingTo("70.0");
        assertThat(response.activityLevel()).isEqualTo(ActivityLevel.SEDENTARY);
        assertThat(response.usedLegacyActivityFallback()).isTrue();
        assertThat(response.bmrKcal()).isEqualByComparingTo("1433");
        assertThat(response.estimatedMaintenanceKcal()).isEqualByComparingTo("1720");
        assertThat(response.estimatedCalorieTargetKcal()).isEqualByComparingTo("1720");
        assertThat(response.estimatedHydrationMl()).isEqualTo(2200);
    }

    @Test
    void returnsExplicitUnavailableTargetsForUnder18Profile() {
        UserProfile profile = profile(3L, Gender.MALE, 30, 60.0);
        profile.setDateOfBirth(LocalDate.now().minusYears(17));
        profile.setActivityLevel(ActivityLevel.VERY_ACTIVE);
        profile.setGoalType(ProfileGoalType.GAIN_WEIGHT);
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(3L))
                .thenReturn(Optional.empty());

        DailyTargetsResponse response = dailyTargetCalculationService.calculateForProfile(profile);

        assertThat(response.age()).isEqualTo(17);
        assertThat(response.adultEligible()).isFalse();
        assertThat(response.bmrKcal()).isNull();
        assertThat(response.estimatedMaintenanceKcal()).isNull();
        assertThat(response.estimatedCalorieTargetKcal()).isNull();
        assertThat(response.proteinTargetG()).isNull();
        assertThat(response.carbohydrateTargetG()).isNull();
        assertThat(response.fatTargetG()).isNull();
        assertThat(response.estimatedHydrationMl()).isNull();
        assertThat(response.calorieTargetsAvailable()).isFalse();
        assertThat(response.hydrationEstimateAvailable()).isFalse();
        assertThat(response.calorieTargetsUnavailableReason()).contains("under 18");
        assertThat(response.hydrationEstimateUnavailableReason()).contains("under 18");
    }

    @Test
    void returnsUnavailableTargetsRatherThanInventingOtherGenderValues() {
        UserProfile profile = profile(4L, Gender.OTHER, 35, 75.0);
        profile.setActivityLevel(ActivityLevel.LIGHTLY_ACTIVE);
        profile.setGoalType(ProfileGoalType.MAINTAIN_WEIGHT);
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(4L))
                .thenReturn(Optional.empty());

        DailyTargetsResponse response = dailyTargetCalculationService.calculateForProfile(profile);

        assertThat(response.adultEligible()).isTrue();
        assertThat(response.bmrKcal()).isNull();
        assertThat(response.estimatedMaintenanceKcal()).isNull();
        assertThat(response.estimatedCalorieTargetKcal()).isNull();
        assertThat(response.estimatedHydrationMl()).isNull();
        assertThat(response.calorieTargetsUnavailableReason()).contains("gender selection");
        assertThat(response.hydrationEstimateUnavailableReason()).contains("gender selection");
    }

    private UserProfile profile(
            Long id,
            Gender gender,
            int legacyAge,
            double currentWeightKg) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setName("Target test profile");
        profile.setGender(gender);
        profile.setAge(legacyAge);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(currentWeightKg);
        profile.setCurrentWeightKg(currentWeightKg);
        profile.setTargetWeightKg(currentWeightKg - 5);
        return profile;
    }

    private HealthMetric metric(UserProfile profile, String weightKg) {
        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(profile);
        metric.setMetricDate(LocalDate.now());
        metric.setWeightKg(new BigDecimal(weightKg));
        return metric;
    }
}
