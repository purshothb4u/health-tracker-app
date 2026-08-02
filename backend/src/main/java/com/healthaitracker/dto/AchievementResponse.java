package com.healthaitracker.dto;

import com.healthaitracker.entity.AchievementType;

public record AchievementResponse(
        AchievementType achievementType,
        String title,
        String supportiveDescription,
        Long userProfileId,
        Long goalId,
        Long challengeId
) {
}
