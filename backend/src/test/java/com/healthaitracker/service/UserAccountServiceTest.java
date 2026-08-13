package com.healthaitracker.service;

import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private HouseholdRepository householdRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private PasswordEncoder passwordEncoder;
    private UserAccountService userAccountService;

    @BeforeEach
    void setUp() {
        passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        userAccountService = new UserAccountService(
                userAccountRepository,
                householdRepository,
                userProfileRepository,
                passwordEncoder);
    }

    @Test
    void createsAccountWithNormalizedEmailEncodedPasswordAndRequestedOwnership() {
        Household household = household(10L);
        UserProfile profile = profile(20L);
        when(userAccountRepository.existsByEmail("purush@example.com")).thenReturn(false);
        when(userAccountRepository.existsByUserProfileId(20L)).thenReturn(false);
        when(householdRepository.findById(10L)).thenReturn(Optional.of(household));
        when(userProfileRepository.findById(20L)).thenReturn(Optional.of(profile));
        when(userAccountRepository.saveAndFlush(any(UserAccount.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserAccount account = userAccountService.createAccount(
                "  Purush@Example.com  ",
                "development-password",
                10L,
                20L);

        assertEquals("purush@example.com", account.getEmail());
        assertNotEquals("development-password", account.getPasswordHash());
        assertTrue(passwordEncoder.matches("development-password", account.getPasswordHash()));
        assertTrue(account.getEnabled());
        assertSame(household, account.getHousehold());
        assertSame(profile, account.getUserProfile());
    }

    @Test
    void rejectsDuplicateAfterEmailNormalization() {
        when(userAccountRepository.existsByEmail("purush@example.com")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userAccountService.createAccount(
                        " Purush@Example.com ",
                        "development-password",
                        10L,
                        20L));

        assertEquals("An account already exists for this email", exception.getMessage());
        verify(userAccountRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsProfileThatAlreadyBelongsToAnAccount() {
        when(userAccountRepository.existsByEmail("kasturi@example.com")).thenReturn(false);
        when(userAccountRepository.existsByUserProfileId(20L)).thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userAccountService.createAccount(
                        "kasturi@example.com",
                        "development-password",
                        10L,
                        20L));

        assertEquals("This user profile already belongs to an account", exception.getMessage());
        verify(userAccountRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsMissingHousehold() {
        when(userAccountRepository.existsByEmail("purush@example.com")).thenReturn(false);
        when(userAccountRepository.existsByUserProfileId(20L)).thenReturn(false);
        when(householdRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> userAccountService.createAccount(
                        "purush@example.com",
                        "development-password",
                        10L,
                        20L));
    }

    @Test
    void rejectsMissingUserProfile() {
        Household household = household(10L);
        when(userAccountRepository.existsByEmail("purush@example.com")).thenReturn(false);
        when(userAccountRepository.existsByUserProfileId(20L)).thenReturn(false);
        when(householdRepository.findById(10L)).thenReturn(Optional.of(household));
        when(userProfileRepository.findById(20L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> userAccountService.createAccount(
                        "purush@example.com",
                        "development-password",
                        10L,
                        20L));
    }

    private Household household(Long id) {
        Household household = new Household();
        household.setId(id);
        household.setDisplayName("Development Household");
        return household;
    }

    private UserProfile profile(Long id) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setName("Husband");
        return profile;
    }
}
