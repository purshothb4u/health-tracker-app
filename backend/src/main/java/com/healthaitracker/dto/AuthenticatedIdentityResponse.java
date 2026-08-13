package com.healthaitracker.dto;

import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.security.AuthenticatedAccountPrincipal;

public record AuthenticatedIdentityResponse(
        String email,
        Long profileId,
        String displayName,
        Long householdId,
        boolean profileComplete
) {

    public static AuthenticatedIdentityResponse fromPrincipalAndProfile(
            AuthenticatedAccountPrincipal principal,
            UserProfile profile,
            boolean profileComplete) {
        return new AuthenticatedIdentityResponse(
                principal.getEmail(),
                principal.getProfileId(),
                profile.getDisplayName(),
                principal.getHouseholdId(),
                profileComplete);
    }
}
