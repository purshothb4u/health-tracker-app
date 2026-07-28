package com.healthaitracker.service;

import com.healthaitracker.entity.Gender;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

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
}
