package com.healthaitracker.service;

import com.healthaitracker.dto.DailyTargetsResponse;
import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class DailyTargetCalculationService {

    private static final int ADULT_AGE = 18;
    private static final String UNDER_18_MESSAGE =
            "Automatic daily target estimates are unavailable for profiles under 18.";
    private static final String UNSUPPORTED_GENDER_CALORIE_MESSAGE =
            "Calorie and macronutrient estimates are unavailable for this gender selection.";
    private static final String UNSUPPORTED_GENDER_HYDRATION_MESSAGE =
            "The adult fluid reference is unavailable for this gender selection.";
    private static final String MISSING_GOAL_MESSAGE =
            "An estimated daily calorie target requires a profile goal.";

    private final UserProfileRepository userProfileRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final HealthCalculationService healthCalculationService;

    public DailyTargetCalculationService(
            UserProfileRepository userProfileRepository,
            HealthMetricRepository healthMetricRepository,
            HealthCalculationService healthCalculationService) {
        this.userProfileRepository = userProfileRepository;
        this.healthMetricRepository = healthMetricRepository;
        this.healthCalculationService = healthCalculationService;
    }

    public DailyTargetsResponse getDailyTargets(Long userProfileId) {
        UserProfile profile = userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
        return calculateForProfile(profile);
    }

    /**
     * Resolves profile-derived inputs once and applies the central calculation policy.
     * The latest health metric is authoritative; profile current weight is the legacy fallback.
     */
    public DailyTargetsResponse calculateForProfile(UserProfile profile) {
        Integer age = profile.getEffectiveAge();
        BigDecimal currentWeightKg = healthMetricRepository
                .findFirstByUserProfileIdOrderByMetricDateDesc(profile.getId())
                .map(HealthMetric::getWeightKg)
                .orElseGet(() -> BigDecimal.valueOf(profile.getCurrentWeightKg()));
        boolean usedLegacyActivityFallback = profile.getActivityLevel() == null;
        ActivityLevel effectiveActivityLevel = usedLegacyActivityFallback
                ? ActivityLevel.SEDENTARY
                : profile.getActivityLevel();
        boolean adultEligible = age != null && age >= ADULT_AGE;

        if (!adultEligible) {
            return unavailableResponse(
                    profile,
                    age,
                    currentWeightKg,
                    effectiveActivityLevel,
                    usedLegacyActivityFallback,
                    UNDER_18_MESSAGE,
                    UNDER_18_MESSAGE);
        }

        BigDecimal bmr = healthCalculationService.calculateBmr(
                currentWeightKg,
                BigDecimal.valueOf(profile.getHeightCm()),
                age,
                profile.getGender());
        BigDecimal maintenance = healthCalculationService.calculateMaintenanceCalories(
                bmr,
                effectiveActivityLevel);
        BigDecimal calorieTarget = healthCalculationService.calculateEstimatedCalorieTarget(
                maintenance,
                profile.getGoalType());
        HealthCalculationService.MacroTargets macroTargets =
                healthCalculationService.calculateMacroTargets(calorieTarget);
        Integer hydrationMl = healthCalculationService.calculateEstimatedHydrationMl(
                profile.getGender());

        String calorieUnavailableReason = null;
        if (bmr == null) {
            calorieUnavailableReason = UNSUPPORTED_GENDER_CALORIE_MESSAGE;
        } else if (profile.getGoalType() == null) {
            calorieUnavailableReason = MISSING_GOAL_MESSAGE;
        }

        return new DailyTargetsResponse(
                age,
                currentWeightKg,
                effectiveActivityLevel,
                usedLegacyActivityFallback,
                profile.getGoalType(),
                true,
                bmr,
                maintenance,
                calorieTarget,
                macroTargets == null ? null : macroTargets.proteinTargetG(),
                macroTargets == null ? null : macroTargets.carbohydrateTargetG(),
                macroTargets == null ? null : macroTargets.fatTargetG(),
                hydrationMl,
                calorieTarget != null,
                calorieUnavailableReason,
                hydrationMl != null,
                hydrationMl == null ? UNSUPPORTED_GENDER_HYDRATION_MESSAGE : null);
    }

    private DailyTargetsResponse unavailableResponse(
            UserProfile profile,
            Integer age,
            BigDecimal currentWeightKg,
            ActivityLevel effectiveActivityLevel,
            boolean usedLegacyActivityFallback,
            String calorieUnavailableReason,
            String hydrationUnavailableReason) {
        return new DailyTargetsResponse(
                age,
                currentWeightKg,
                effectiveActivityLevel,
                usedLegacyActivityFallback,
                profile.getGoalType(),
                false,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                calorieUnavailableReason,
                false,
                hydrationUnavailableReason);
    }
}
