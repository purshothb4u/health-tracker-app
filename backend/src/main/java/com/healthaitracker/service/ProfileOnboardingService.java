package com.healthaitracker.service;

import com.healthaitracker.dto.ProfileOnboardingRequest;
import com.healthaitracker.dto.ProfileOnboardingResponse;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ProfileOnboardingValidationException;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;

@Service
@Transactional(readOnly = true)
public class ProfileOnboardingService {

    private static final String INITIAL_WEIGHT_NOTE =
            "Initial weight recorded during profile setup.";

    private final UserProfileRepository userProfileRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final ProfileCompletenessService profileCompletenessService;

    public ProfileOnboardingService(
            UserProfileRepository userProfileRepository,
            HealthMetricRepository healthMetricRepository,
            ProfileCompletenessService profileCompletenessService) {
        this.userProfileRepository = userProfileRepository;
        this.healthMetricRepository = healthMetricRepository;
        this.profileCompletenessService = profileCompletenessService;
    }

    public ProfileOnboardingResponse getProfile(Long profileId) {
        return toResponse(findProfileOrThrow(profileId));
    }

    @Transactional
    public ProfileOnboardingResponse saveProfile(
            Long profileId,
            ProfileOnboardingRequest request) {
        UserProfile profile = findProfileOrThrow(profileId);
        int derivedAge = deriveAge(request.dateOfBirth());
        BigDecimal submittedCurrentWeight = normalizedWeight(request.currentWeightKg());
        HealthMetric latestMetric = healthMetricRepository
                .findFirstByUserProfileIdOrderByMetricDateDesc(profileId)
                .orElse(null);

        if (latestMetric != null
                && submittedCurrentWeight.compareTo(latestMetric.getWeightKg()) != 0) {
            throw new ProfileOnboardingValidationException(
                    "currentWeightKg",
                    "Current weight must match the latest health metric. Update weight from the Health page.");
        }

        profile.setDisplayName(request.displayName().trim());
        profile.setGender(request.sex());
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setAge(derivedAge);
        profile.setHeightCm(request.heightCm().doubleValue());
        profile.setTargetWeightKg(request.targetWeightKg().doubleValue());
        profile.setActivityLevel(request.activityLevel());
        profile.setGoalType(request.goalType());

        if (latestMetric == null) {
            profile.setStartingWeightKg(submittedCurrentWeight.doubleValue());
            profile.setCurrentWeightKg(submittedCurrentWeight.doubleValue());
            userProfileRepository.save(profile);

            HealthMetric initialMetric = new HealthMetric();
            initialMetric.setUserProfile(profile);
            initialMetric.setMetricDate(LocalDate.now());
            initialMetric.setWeightKg(submittedCurrentWeight);
            initialMetric.setNotes(INITIAL_WEIGHT_NOTE);
            healthMetricRepository.save(initialMetric);
        } else {
            profile.setCurrentWeightKg(latestMetric.getWeightKg().doubleValue());
        }

        return toResponse(userProfileRepository.save(profile));
    }

    private UserProfile findProfileOrThrow(Long profileId) {
        return userProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
    }

    private int deriveAge(LocalDate dateOfBirth) {
        int age = Period.between(dateOfBirth, LocalDate.now()).getYears();
        if (age < 1 || age > 150) {
            throw new ProfileOnboardingValidationException(
                    "dateOfBirth",
                    "Date of birth must produce an age between 1 and 150 years");
        }
        return age;
    }

    private BigDecimal normalizedWeight(BigDecimal weight) {
        return weight.setScale(2, RoundingMode.HALF_UP);
    }

    private ProfileOnboardingResponse toResponse(UserProfile profile) {
        HealthMetric latestMetric = healthMetricRepository
                .findFirstByUserProfileIdOrderByMetricDateDesc(profile.getId())
                .orElse(null);
        BigDecimal currentWeight = latestMetric == null
                ? decimalOrNull(profile.getCurrentWeightKg())
                : latestMetric.getWeightKg();

        return new ProfileOnboardingResponse(
                profile.getId(),
                profile.getDisplayName(),
                profile.getGender(),
                profile.getDateOfBirth(),
                profile.getEffectiveAge(),
                decimalOrNull(profile.getHeightCm()),
                currentWeight,
                decimalOrNull(profile.getTargetWeightKg()),
                profile.getActivityLevel(),
                profile.getGoalType(),
                profileCompletenessService.isComplete(profile),
                latestMetric != null);
    }

    private BigDecimal decimalOrNull(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }
}
