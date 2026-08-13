package com.healthaitracker.service;

import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.ProfileGoalType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class HealthCalculationServiceTest {

    private final HealthCalculationService healthCalculationService = new HealthCalculationService();

    @Test
    void calculatesBmiBmrMaintenanceCaloriesAndWeightProgress() {
        BigDecimal weightKg = new BigDecimal("85.00");
        BigDecimal heightCm = new BigDecimal("175.00");

        BigDecimal bmi = healthCalculationService.calculateBmi(weightKg, heightCm);
        BigDecimal bmr = healthCalculationService.calculateBmr(weightKg, heightCm, 30, Gender.MALE);
        BigDecimal maintenanceCalories = healthCalculationService.calculateMaintenanceCalories(bmr);
        HealthCalculationService.WeightProgress progress = healthCalculationService.calculateWeightProgress(
                new BigDecimal("87.00"), weightKg, new BigDecimal("75.00"));

        assertThat(bmi).isEqualByComparingTo("27.76");
        assertThat(bmr).isEqualByComparingTo("1799");
        assertThat(maintenanceCalories).isEqualByComparingTo("2159");
        assertThat(progress.weightLostKg()).isEqualByComparingTo("2.00");
        assertThat(progress.weightRemainingKg()).isEqualByComparingTo("10.00");
        assertThat(progress.goalProgressPercent()).isEqualByComparingTo("16.67");
    }

    @Test
    void returnsNoBmrOrMaintenanceEstimateForOtherGender() {
        BigDecimal bmr = healthCalculationService.calculateBmr(
                new BigDecimal("70.00"), new BigDecimal("165.00"), 30, Gender.OTHER);

        assertThat(bmr).isNull();
        assertThat(healthCalculationService.calculateMaintenanceCalories(bmr)).isNull();
    }

    @Test
    void appliesEachCentralizedActivityFactorWithWholeKcalRounding() {
        BigDecimal bmr = new BigDecimal("1799");

        assertThat(healthCalculationService.calculateMaintenanceCalories(bmr, ActivityLevel.SEDENTARY))
                .isEqualByComparingTo("2159");
        assertThat(healthCalculationService.calculateMaintenanceCalories(bmr, ActivityLevel.LIGHTLY_ACTIVE))
                .isEqualByComparingTo("2474");
        assertThat(healthCalculationService.calculateMaintenanceCalories(bmr, ActivityLevel.MODERATELY_ACTIVE))
                .isEqualByComparingTo("2788");
        assertThat(healthCalculationService.calculateMaintenanceCalories(bmr, ActivityLevel.VERY_ACTIVE))
                .isEqualByComparingTo("3103");
        assertThat(healthCalculationService.calculateMaintenanceCalories(bmr, null))
                .isEqualByComparingTo("2159");
    }

    @Test
    void appliesGoalFactorsToEstimatedMaintenance() {
        BigDecimal maintenance = new BigDecimal("2400");

        assertThat(healthCalculationService.calculateEstimatedCalorieTarget(
                maintenance, ProfileGoalType.LOSE_WEIGHT)).isEqualByComparingTo("2160");
        assertThat(healthCalculationService.calculateEstimatedCalorieTarget(
                maintenance, ProfileGoalType.MAINTAIN_WEIGHT)).isEqualByComparingTo("2400");
        assertThat(healthCalculationService.calculateEstimatedCalorieTarget(
                maintenance, ProfileGoalType.GAIN_WEIGHT)).isEqualByComparingTo("2640");
    }

    @Test
    void convertsMacroEnergySplitToOneDecimalGramTargetsWithinRoundingTolerance() {
        BigDecimal calorieTarget = new BigDecimal("2159");

        HealthCalculationService.MacroTargets targets =
                healthCalculationService.calculateMacroTargets(calorieTarget);

        assertThat(targets.proteinTargetG()).isEqualByComparingTo("134.9");
        assertThat(targets.carbohydrateTargetG()).isEqualByComparingTo("242.9");
        assertThat(targets.fatTargetG()).isEqualByComparingTo("72.0");
        BigDecimal reconstructedCalories = targets.proteinTargetG().multiply(BigDecimal.valueOf(4))
                .add(targets.carbohydrateTargetG().multiply(BigDecimal.valueOf(4)))
                .add(targets.fatTargetG().multiply(BigDecimal.valueOf(9)));
        assertThat(reconstructedCalories).isCloseTo(calorieTarget, within(new BigDecimal("1.0")));
    }

    @Test
    void returnsAdultFluidReferencesOnlyForSupportedGenderValues() {
        assertThat(healthCalculationService.calculateEstimatedHydrationMl(Gender.MALE)).isEqualTo(3000);
        assertThat(healthCalculationService.calculateEstimatedHydrationMl(Gender.FEMALE)).isEqualTo(2200);
        assertThat(healthCalculationService.calculateEstimatedHydrationMl(Gender.OTHER)).isNull();
        assertThat(healthCalculationService.calculateEstimatedHydrationMl(null)).isNull();
    }
}
