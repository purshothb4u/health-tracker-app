package com.healthaitracker.service;

import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserAccountService {

    public static final int MINIMUM_PASSWORD_LENGTH = 12;
    public static final int MAXIMUM_PASSWORD_BYTES = 72;

    private static final String PERSONAL_HOUSEHOLD_NAME = "Personal household";
    private static final String INTERNAL_PROFILE_NAME_PREFIX = "Account profile ";

    private final UserAccountRepository userAccountRepository;
    private final HouseholdRepository householdRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(
            UserAccountRepository userAccountRepository,
            HouseholdRepository householdRepository,
            UserProfileRepository userProfileRepository,
            PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.householdRepository = householdRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public UserAccount createAccount(
            String email,
            String rawPassword,
            Long householdId,
            Long userProfileId) {
        String normalizedEmail = normalizeEmail(email);
        validateRawPassword(rawPassword);

        rejectUnavailableEmail(normalizedEmail);
        if (userProfileId == null) {
            throw new IllegalArgumentException("User profile is required");
        }
        if (userAccountRepository.existsByUserProfileId(userProfileId)) {
            throw new IllegalArgumentException("This user profile already belongs to an account");
        }

        Household household = findHouseholdOrThrow(householdId);
        UserProfile userProfile = findUserProfileOrThrow(userProfileId);

        try {
            return saveAccount(normalizedEmail, rawPassword, household, userProfile);
        } catch (DataIntegrityViolationException ex) {
            throw translateOwnershipConflict(ex);
        }
    }

    @Transactional
    public UserAccount registerAccount(String email, String rawPassword) {
        String normalizedEmail = normalizeEmail(email);
        validateRawPassword(rawPassword);
        rejectUnavailableEmail(normalizedEmail);

        Household household = new Household();
        household.setDisplayName(PERSONAL_HOUSEHOLD_NAME);
        household = householdRepository.save(household);

        UserProfile profile = new UserProfile();
        profile.setName(INTERNAL_PROFILE_NAME_PREFIX + UUID.randomUUID());
        profile = userProfileRepository.save(profile);

        try {
            return saveAccount(normalizedEmail, rawPassword, household, profile);
        } catch (DataIntegrityViolationException ex) {
            RuntimeException translated = translateOwnershipConflict(ex);
            if (translated == ex) {
                throw new IllegalStateException("Unable to create account", ex);
            }
            throw translated;
        }
    }

    public void validateRawPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (rawPassword.length() < MINIMUM_PASSWORD_LENGTH) {
            throw new IllegalArgumentException(
                    "Password must contain at least " + MINIMUM_PASSWORD_LENGTH + " characters");
        }
        if (rawPassword.getBytes(StandardCharsets.UTF_8).length > MAXIMUM_PASSWORD_BYTES) {
            throw new IllegalArgumentException(
                    "Password must not exceed " + MAXIMUM_PASSWORD_BYTES + " UTF-8 bytes");
        }
    }

    private void rejectUnavailableEmail(String normalizedEmail) {
        if (userAccountRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account already exists for this email");
        }
    }

    private UserAccount saveAccount(
            String normalizedEmail,
            String rawPassword,
            Household household,
            UserProfile userProfile) {
        UserAccount account = new UserAccount();
        account.setEmail(normalizedEmail);
        account.setPasswordHash(passwordEncoder.encode(rawPassword));
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(userProfile);
        return userAccountRepository.saveAndFlush(account);
    }

    private Household findHouseholdOrThrow(Long householdId) {
        if (householdId == null) {
            throw new IllegalArgumentException("Household is required");
        }
        return householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found with id: " + householdId));
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private RuntimeException translateOwnershipConflict(DataIntegrityViolationException cause) {
        Throwable current = cause;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String normalizedMessage = message.toLowerCase(Locale.ROOT);
                if (normalizedMessage.contains("uk_user_accounts_email")) {
                    return new IllegalArgumentException("An account already exists for this email", cause);
                }
                if (normalizedMessage.contains("uk_user_accounts_user_profile")) {
                    return new IllegalArgumentException(
                            "This user profile already belongs to an account",
                            cause);
                }
            }
            current = current.getCause();
        }
        return cause;
    }
}
