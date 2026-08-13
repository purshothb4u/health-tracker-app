package com.healthaitracker.service;

import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.ProfileGoalType;
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
    private static final BigDecimal LIGHTLY_ACTIVE_ACTIVITY_FACTOR = new BigDecimal("1.375");
    private static final BigDecimal MODERATELY_ACTIVE_ACTIVITY_FACTOR = new BigDecimal("1.55");
    private static final BigDecimal VERY_ACTIVE_ACTIVITY_FACTOR = new BigDecimal("1.725");
    private static final BigDecimal LOSE_WEIGHT_TARGET_FACTOR = new BigDecimal("0.90");
    private static final BigDecimal MAINTAIN_WEIGHT_TARGET_FACTOR = new BigDecimal("1.00");
    private static final BigDecimal GAIN_WEIGHT_TARGET_FACTOR = new BigDecimal("1.10");
    private static final BigDecimal PROTEIN_ENERGY_SHARE = new BigDecimal("0.25");
    private static final BigDecimal CARBOHYDRATE_ENERGY_SHARE = new BigDecimal("0.45");
    private static final BigDecimal FAT_ENERGY_SHARE = new BigDecimal("0.30");
    private static final BigDecimal PROTEIN_KCAL_PER_GRAM = BigDecimal.valueOf(4);
    private static final BigDecimal CARBOHYDRATE_KCAL_PER_GRAM = BigDecimal.valueOf(4);
    private static final BigDecimal FAT_KCAL_PER_GRAM = BigDecimal.valueOf(9);
    private static final int MALE_ESTIMATED_HYDRATION_ML = 3000;
    private static final int FEMALE_ESTIMATED_HYDRATION_ML = 2200;
    private static final int MACRO_GRAM_SCALE = 1;

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
     * This overload preserves the legacy compatibility behavior.
     * Returns null when BMR cannot be calculated.
     */
    public BigDecimal calculateMaintenanceCalories(BigDecimal bmrCaloriesPerDay) {
        return calculateMaintenanceCalories(bmrCaloriesPerDay, null);
    }

    /**
     * Estimates maintenance calories using the profile activity factor. A missing
     * activity level uses the legacy sedentary factor. Results are rounded to the
     * nearest whole kcal with HALF_UP rounding.
     */
    public BigDecimal calculateMaintenanceCalories(
            BigDecimal bmrCaloriesPerDay,
            ActivityLevel activityLevel) {
        if (bmrCaloriesPerDay == null) {
            return null;
        }
        requirePositive(bmrCaloriesPerDay, "BMR");
        return bmrCaloriesPerDay
                .multiply(activityFactor(activityLevel))
                .setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Applies the HealthAITracker goal policy to maintenance calories and rounds
     * to the nearest whole kcal with HALF_UP rounding.
     */
    public BigDecimal calculateEstimatedCalorieTarget(
            BigDecimal maintenanceCalories,
            ProfileGoalType goalType) {
        if (maintenanceCalories == null || goalType == null) {
            return null;
        }
        requirePositive(maintenanceCalories, "Maintenance calories");
        BigDecimal goalFactor = switch (goalType) {
            case LOSE_WEIGHT -> LOSE_WEIGHT_TARGET_FACTOR;
            case MAINTAIN_WEIGHT -> MAINTAIN_WEIGHT_TARGET_FACTOR;
            case GAIN_WEIGHT -> GAIN_WEIGHT_TARGET_FACTOR;
        };
        return maintenanceCalories.multiply(goalFactor)
                .setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Converts the 25/45/30 energy split to grams. Each gram target is rounded
     * to one decimal place with HALF_UP rounding.
     */
    public MacroTargets calculateMacroTargets(BigDecimal calorieTarget) {
        if (calorieTarget == null) {
            return null;
        }
        requirePositive(calorieTarget, "Calorie target");
        return new MacroTargets(
                caloriesToGrams(calorieTarget, PROTEIN_ENERGY_SHARE, PROTEIN_KCAL_PER_GRAM),
                caloriesToGrams(
                        calorieTarget,
                        CARBOHYDRATE_ENERGY_SHARE,
                        CARBOHYDRATE_KCAL_PER_GRAM),
                caloriesToGrams(calorieTarget, FAT_ENERGY_SHARE, FAT_KCAL_PER_GRAM));
    }

    /**
     * Returns the general-adult estimated daily fluid reference for supported
     * gender values. OTHER or a missing gender returns null rather than an estimate.
     */
    public Integer calculateEstimatedHydrationMl(Gender gender) {
        if (gender == null) {
            return null;
        }
        return switch (gender) {
            case MALE -> MALE_ESTIMATED_HYDRATION_ML;
            case FEMALE -> FEMALE_ESTIMATED_HYDRATION_ML;
            case OTHER -> null;
        };
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

    private BigDecimal activityFactor(ActivityLevel activityLevel) {
        if (activityLevel == null) {
            return SEDENTARY_ACTIVITY_FACTOR;
        }
        return switch (activityLevel) {
            case SEDENTARY -> SEDENTARY_ACTIVITY_FACTOR;
            case LIGHTLY_ACTIVE -> LIGHTLY_ACTIVE_ACTIVITY_FACTOR;
            case MODERATELY_ACTIVE -> MODERATELY_ACTIVE_ACTIVITY_FACTOR;
            case VERY_ACTIVE -> VERY_ACTIVE_ACTIVITY_FACTOR;
        };
    }

    private BigDecimal caloriesToGrams(
            BigDecimal calorieTarget,
            BigDecimal energyShare,
            BigDecimal kcalPerGram) {
        return calorieTarget.multiply(energyShare)
                .divide(kcalPerGram, MACRO_GRAM_SCALE, RoundingMode.HALF_UP);
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

    public record MacroTargets(
            BigDecimal proteinTargetG,
            BigDecimal carbohydrateTargetG,
            BigDecimal fatTargetG
    ) {
    }
}
