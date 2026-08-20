package com.healthaitracker.config;

import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.PartnerInvitation;
import com.healthaitracker.entity.ProfileGoalType;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.PartnerInvitationRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.service.ProfileCompletenessService;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("flyway-test")
class FlywaySchemaIntegrationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PartnerInvitationRepository partnerInvitationRepository;

    @Autowired
    private ProfileCompletenessService profileCompletenessService;

    @Test
    void migratesAnEmptyDatabaseAndValidatesTheCurrentJpaModel() {
        MigrationInfo versionOne = Arrays.stream(flyway.info().applied())
                .filter(migration -> "1".equals(migration.getVersion().getVersion()))
                .findFirst()
                .orElseThrow();
        MigrationInfo versionTwo = Arrays.stream(flyway.info().applied())
                .filter(migration -> "2".equals(migration.getVersion().getVersion()))
                .findFirst()
                .orElseThrow();
        MigrationInfo versionThree = Arrays.stream(flyway.info().applied())
                .filter(migration -> "3".equals(migration.getVersion().getVersion()))
                .findFirst()
                .orElseThrow();
        MigrationInfo versionFour = Arrays.stream(flyway.info().applied())
                .filter(migration -> "4".equals(migration.getVersion().getVersion()))
                .findFirst()
                .orElseThrow();

        assertEquals(MigrationState.SUCCESS, versionOne.getState());
        assertEquals(MigrationState.SUCCESS, versionTwo.getState());
        assertEquals(MigrationState.SUCCESS, versionThree.getState());
        assertEquals(MigrationState.SUCCESS, versionFour.getState());
        assertEquals(
                1,
                jdbcTemplate.queryForObject(
                        """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE UPPER(TABLE_NAME) = 'FLYWAY_SCHEMA_HISTORY'
                        """,
                        Integer.class));
        assertEquals(
                2,
                jdbcTemplate.queryForObject(
                        """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE UPPER(TABLE_NAME) IN (
                            'SPRING_SESSION',
                            'SPRING_SESSION_ATTRIBUTES'
                        )
                        """,
                        Integer.class));
        assertNotNull(householdRepository);
        assertNotNull(userProfileRepository);
        assertNotNull(userAccountRepository);
        assertNotNull(partnerInvitationRepository);

        Household household = householdRepository.saveAndFlush(household("Migration household"));
        UserProfile firstProfile = userProfileRepository.saveAndFlush(profile("First profile"));
        UserProfile secondProfile = userProfileRepository.saveAndFlush(profile("Second profile"));
        UserProfile thirdProfile = userProfileRepository.saveAndFlush(profile("Third profile"));
        UserProfile incompleteProfile = new UserProfile();
        incompleteProfile.setName("Internal compatibility profile");
        incompleteProfile = userProfileRepository.saveAndFlush(incompleteProfile);

        assertNull(incompleteProfile.getGender());
        assertNull(incompleteProfile.getAge());
        assertNull(incompleteProfile.getHeightCm());
        assertNull(incompleteProfile.getStartingWeightKg());
        assertNull(incompleteProfile.getCurrentWeightKg());
        assertNull(incompleteProfile.getTargetWeightKg());
        assertFalse(profileCompletenessService.isComplete(incompleteProfile));
        assertTrue(profileCompletenessService.isComplete(firstProfile));

        UserAccount firstAccount = userAccountRepository.saveAndFlush(
                account("first@example.com", household, firstProfile));
        assertNotNull(firstAccount.getId());

        assertThrows(
                DataIntegrityViolationException.class,
                () -> userAccountRepository.saveAndFlush(
                        account("first@example.com", household, secondProfile)));
        assertThrows(
                DataIntegrityViolationException.class,
                () -> userAccountRepository.saveAndFlush(
                        account("second@example.com", household, firstProfile)));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        INSERT INTO user_accounts (
                            email, password_hash, enabled, household_id, user_profile_id,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """,
                        "foreign-key@example.com",
                        "{bcrypt}migration-test-hash",
                        true,
                        Long.MAX_VALUE,
                        thirdProfile.getId()));
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        INSERT INTO user_accounts (
                            email, password_hash, enabled, household_id, user_profile_id,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """,
                        "profile-foreign-key@example.com",
                        "{bcrypt}migration-test-hash",
                        true,
                        household.getId(),
                        Long.MAX_VALUE));

        assertTrue(userAccountRepository.findByEmail("first@example.com").isPresent());

        PartnerInvitation invitation = new PartnerInvitation();
        invitation.setHousehold(household);
        invitation.setInviterAccount(firstAccount);
        invitation.setInviteCodeHash("a".repeat(64));
        invitation.setCreatedAt(java.time.LocalDateTime.now());
        invitation.setExpiresAt(java.time.LocalDateTime.now().plusDays(7));
        invitation = partnerInvitationRepository.saveAndFlush(invitation);
        assertNotNull(invitation.getId());
        assertEquals(64, invitation.getInviteCodeHash().length());
    }

    private Household household(String displayName) {
        Household household = new Household();
        household.setDisplayName(displayName);
        return household;
    }

    private UserProfile profile(String name) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setDisplayName(name);
        profile.setGender(Gender.OTHER);
        profile.setDateOfBirth(LocalDate.now().minusYears(30));
        profile.setAge(30);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(80.0);
        profile.setCurrentWeightKg(78.0);
        profile.setTargetWeightKg(70.0);
        profile.setActivityLevel(ActivityLevel.MODERATELY_ACTIVE);
        profile.setGoalType(ProfileGoalType.MAINTAIN_WEIGHT);
        return profile;
    }

    private UserAccount account(String email, Household household, UserProfile profile) {
        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash("{bcrypt}migration-test-hash");
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(profile);
        return account;
    }
}
