package com.healthaitracker.dto;

import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;

public record AuthenticatedIdentityResponse(
        String email,
        Long profileId,
        String displayName,
        Long householdId,
        boolean profileComplete
) {

    public static AuthenticatedIdentityResponse fromAccount(
            UserAccount account,
            boolean profileComplete) {
        UserProfile profile = account.getUserProfile();
        return new AuthenticatedIdentityResponse(
                account.getEmail(),
                profile.getId(),
                profile.getDisplayName(),
                account.getHousehold().getId(),
                profileComplete);
    }
}
