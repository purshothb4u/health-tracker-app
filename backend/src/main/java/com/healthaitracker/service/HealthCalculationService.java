package com.healthaitracker.service;

import com.healthaitracker.entity.Gender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class HealthCalculationService {

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal TEN = BigDecimal.TEN;
    private static final BigDecimal HEIGHT_MULTIPLIER = new BigDecimal("6.25");
    private static final BigDecimal AGE_MULTIPLIER = BigDecimal.valueOf(5);
    private static final BigDecimal MALE_BMR_ADJUSTMENT = BigDecimal.valueOf(5);
    private static final BigDecimal FEMALE_BMR_ADJUSTMENT = BigDecimal.valueOf(-161);
    private static final BigDecimal SEDENTARY_ACTIVITY_FACTOR = new BigDecimal("1.20");

    /**
     * Calculates BMI as weight in kilograms divided by height in metres squared.
     */
    public BigDecimal calculateBmi(BigDecimal weightKg, BigDecimal heightCm) {
        requirePositive(weightKg, "Weight");
        requirePositive(heightCm, "Height");

        BigDecimal heightMeters = heightCm.divide(ONE_HUNDRED);
        return weightKg.divide(heightMeters.pow(2), 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates BMR with the Mifflin-St Jeor equation.
     * Returns null when gender is unavailable or OTHER because this equation requires a male or female adjustment.
     */
    public BigDecimal calculateBmr(BigDecimal weightKg, BigDecimal heightCm, Integer age, Gender gender) {
        requirePositive(weightKg, "Weight");
        requirePositive(heightCm, "Height");
        if (age == null || age <= 0) {
            throw new IllegalArgumentException("Age must be positive");
        }
        BigDecimal genderAdjustment = getBmrAdjustment(gender);
        if (genderAdjustment == null) {
            return null;
        }

        BigDecimal bmr = weightKg.multiply(TEN)
                .add(heightCm.multiply(HEIGHT_MULTIPLIER))
                .subtract(BigDecimal.valueOf(age).multiply(AGE_MULTIPLIER))
                .add(genderAdjustment);

        return bmr.setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Estimates sedentary daily maintenance calories as BMR multiplied by 1.20.
     * Returns null when BMR cannot be calculated.
     */
    public BigDecimal calculateMaintenanceCalories(BigDecimal bmrCaloriesPerDay) {
        if (bmrCaloriesPerDay == null) {
            return null;
        }
        requirePositive(bmrCaloriesPerDay, "BMR");
        return bmrCaloriesPerDay
                .multiply(SEDENTARY_ACTIVITY_FACTOR)
                .setScale(0, RoundingMode.HALF_UP);
    }

    public WeightProgress calculateWeightProgress(
            BigDecimal startingWeightKg,
            BigDecimal latestWeightKg,
            BigDecimal targetWeightKg) {
        requirePositive(startingWeightKg, "Starting weight");
        requirePositive(latestWeightKg, "Latest weight");
        requirePositive(targetWeightKg, "Target weight");

        BigDecimal weightLost = startingWeightKg.subtract(latestWeightKg).setScale(2, RoundingMode.HALF_UP);
        BigDecimal weightRemaining = latestWeightKg.subtract(targetWeightKg).max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalGoal = startingWeightKg.subtract(targetWeightKg);
        BigDecimal progressPercent = BigDecimal.ZERO;

        if (totalGoal.signum() > 0) {
            progressPercent = weightLost.multiply(ONE_HUNDRED)
                    .divide(totalGoal, 2, RoundingMode.HALF_UP)
                    .max(BigDecimal.ZERO)
                    .min(ONE_HUNDRED);
        }

        return new WeightProgress(weightLost, weightRemaining, progressPercent);
    }

    private BigDecimal getBmrAdjustment(Gender gender) {
        if (gender == null) {
            return null;
        }
        return switch (gender) {
            case MALE -> MALE_BMR_ADJUSTMENT;
            case FEMALE -> FEMALE_BMR_ADJUSTMENT;
            case OTHER -> null;
        };
    }

    private void requirePositive(BigDecimal value, String fieldName) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalArgumentException(fieldName + " must be positive");
        }
    }

    public record WeightProgress(
            BigDecimal weightLostKg,
            BigDecimal weightRemainingKg,
            BigDecimal goalProgressPercent
    ) {
    }
}
