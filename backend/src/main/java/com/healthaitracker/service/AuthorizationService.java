package com.healthaitracker.service;

import com.healthaitracker.dto.EligibleCoupleParticipantResponse;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.security.AuthenticatedAccountPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class AuthorizationService {

    private static final String ACCESS_DENIED_MESSAGE = "Access denied";

    private final UserAccountRepository userAccountRepository;

    public AuthorizationService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public Long currentProfileId() {
        return currentPrincipal().getProfileId();
    }

    public void requireSelf(Long requestedProfileId) {
        if (!Objects.equals(currentProfileId(), requestedProfileId)) {
            throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        }
    }

    public void requireChallengeCreationParticipants(List<Long> participantProfileIds) {
        AuthenticatedAccountPrincipal principal = currentPrincipal();
        if (!participantProfileIds.contains(principal.getProfileId())) {
            throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        }
        if (!allProfilesBelongToHousehold(participantProfileIds, principal.getHouseholdId())) {
            throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        }
    }

    public void requireChallengeAccess(List<CoupleChallengeParticipant> participants) {
        if (!canAccessChallenge(participants)) {
            throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        }
    }

    public boolean canAccessChallenge(List<CoupleChallengeParticipant> participants) {
        AuthenticatedAccountPrincipal principal = currentPrincipal();
        List<Long> participantProfileIds = participants.stream()
                .map(CoupleChallengeParticipant::getUserProfile)
                .map(UserProfile::getId)
                .toList();
        return participantProfileIds.contains(principal.getProfileId())
                && allProfilesBelongToHousehold(
                        participantProfileIds,
                        principal.getHouseholdId());
    }

    public void requireProfileInCurrentHousehold(Long profileId) {
        AuthenticatedAccountPrincipal principal = currentPrincipal();
        UserAccount account = userAccountRepository.findByUserProfileId(profileId)
                .orElseThrow(() -> new AccessDeniedException(ACCESS_DENIED_MESSAGE));
        if (!Objects.equals(account.getHousehold().getId(), principal.getHouseholdId())) {
            throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        }
    }

    public List<EligibleCoupleParticipantResponse> getEligibleCoupleParticipants() {
        Long householdId = currentPrincipal().getHouseholdId();
        return userAccountRepository.findByHouseholdIdOrderByUserProfileIdAsc(householdId).stream()
                .map(UserAccount::getUserProfile)
                .map(profile -> new EligibleCoupleParticipantResponse(
                        profile.getId(),
                        resolvedDisplayName(profile)))
                .toList();
    }

    private boolean allProfilesBelongToHousehold(
            List<Long> profileIds,
            Long householdId) {
        if (profileIds.isEmpty()) {
            return false;
        }
        return profileIds.stream().allMatch(profileId -> userAccountRepository
                .findByUserProfileId(profileId)
                .map(UserAccount::getHousehold)
                .map(household -> Objects.equals(household.getId(), householdId))
                .orElse(false));
    }

    private AuthenticatedAccountPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AuthenticatedAccountPrincipal principal)) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        return principal;
    }

    private String resolvedDisplayName(UserProfile profile) {
        return profile.getDisplayName() == null || profile.getDisplayName().isBlank()
                ? profile.getName()
                : profile.getDisplayName();
    }
}
