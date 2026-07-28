package com.healthaitracker.dto;

import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.UserProfile;

import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String name,
        Gender gender,
        Integer age,
        Double heightCm,
        Double startingWeightKg,
        Double currentWeightKg,
        Double targetWeightKg,
        Double weightLostKg,
        Double weightRemainingKg,
        Double goalProgressPercent,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static UserProfileResponse fromEntity(UserProfile profile) {
        double weightLost = profile.getStartingWeightKg() - profile.getCurrentWeightKg();
        double weightRemaining = profile.getCurrentWeightKg() - profile.getTargetWeightKg();
        double totalGoal = profile.getStartingWeightKg() - profile.getTargetWeightKg();
        double goalProgressPercent = totalGoal > 0
                ? Math.min(100.0, Math.max(0.0, (weightLost / totalGoal) * 100.0))
                : 0.0;

        return new UserProfileResponse(
                profile.getId(),
                profile.getName(),
                profile.getGender(),
                profile.getAge(),
                profile.getHeightCm(),
                profile.getStartingWeightKg(),
                profile.getCurrentWeightKg(),
                profile.getTargetWeightKg(),
                round(weightLost),
                round(weightRemaining),
                round(goalProgressPercent),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
