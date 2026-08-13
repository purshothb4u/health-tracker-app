package com.healthaitracker.service;

import com.healthaitracker.entity.UserProfile;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class ProfileCompletenessService {

    public boolean isComplete(UserProfile profile) {
        return profile.getDisplayName() != null
                && !profile.getDisplayName().isBlank()
                && profile.getGender() != null
                && profile.getDateOfBirth() != null
                && profile.getDateOfBirth().isBefore(LocalDate.now())
                && profile.getEffectiveAge() != null
                && profile.getEffectiveAge() >= 1
                && profile.getEffectiveAge() <= 150
                && profile.getHeightCm() != null
                && profile.getHeightCm() > 0
                && profile.getCurrentWeightKg() != null
                && profile.getCurrentWeightKg() > 0
                && profile.getTargetWeightKg() != null
                && profile.getTargetWeightKg() > 0
                && profile.getActivityLevel() != null
                && profile.getGoalType() != null;
    }
}
