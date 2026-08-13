package com.healthaitracker.dto;

import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.ProfileGoalType;
import com.healthaitracker.entity.UserProfile;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String name,
        String displayName,
        Gender gender,
        LocalDate dateOfBirth,
        Integer age,
        Double heightCm,
        Double startingWeightKg,
        Double currentWeightKg,
        Double targetWeightKg,
        ActivityLevel activityLevel,
        ProfileGoalType goalType,
        Double weightLostKg,
        Double weightRemainingKg,
        Double goalProgressPercent,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static UserProfileResponse fromEntity(UserProfile profile) {
        Double weightLost = null;
        Double weightRemaining = null;
        Double goalProgressPercent = null;
        if (profile.getStartingWeightKg() != null
                && profile.getCurrentWeightKg() != null
                && profile.getTargetWeightKg() != null) {
            weightLost = profile.getStartingWeightKg() - profile.getCurrentWeightKg();
            weightRemaining = profile.getCurrentWeightKg() - profile.getTargetWeightKg();
            double totalGoal = profile.getStartingWeightKg() - profile.getTargetWeightKg();
            goalProgressPercent = totalGoal > 0
                    ? Math.min(100.0, Math.max(0.0, (weightLost / totalGoal) * 100.0))
                    : 0.0;
        }

        return new UserProfileResponse(
                profile.getId(),
                profile.getName(),
                resolveDisplayName(profile),
                profile.getGender(),
                profile.getDateOfBirth(),
                profile.getEffectiveAge(),
                profile.getHeightCm(),
                profile.getStartingWeightKg(),
                profile.getCurrentWeightKg(),
                profile.getTargetWeightKg(),
                profile.getActivityLevel(),
                profile.getGoalType(),
                roundOrNull(weightLost),
                roundOrNull(weightRemaining),
                roundOrNull(goalProgressPercent),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private static String resolveDisplayName(UserProfile profile) {
        String displayName = profile.getDisplayName();
        return displayName == null || displayName.isBlank() ? null : displayName;
    }

    private static Double roundOrNull(Double value) {
        if (value == null) {
            return null;
        }
        return Math.round(value * 10.0) / 10.0;
    }
}
