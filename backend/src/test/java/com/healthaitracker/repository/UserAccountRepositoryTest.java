package com.healthaitracker.repository;

import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest(properties =
        "spring.datasource.url=jdbc:h2:mem:user-account-repository-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
class UserAccountRepositoryTest {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Test
    void allowsMultipleAccountsInOneHouseholdWithDistinctProfiles() {
        Household household = householdRepository.save(household("Shared household"));
        UserProfile husband = userProfileRepository.save(profile("Husband", Gender.MALE));
        UserProfile wife = userProfileRepository.save(profile("Wife", Gender.FEMALE));

        UserAccount first = userAccountRepository.saveAndFlush(
                account("purush@example.com", household, husband));
        UserAccount second = userAccountRepository.saveAndFlush(
                account("kasturi@example.com", household, wife));

        assertSame(household, first.getHousehold());
        assertSame(household, second.getHousehold());
        assertSame(husband, first.getUserProfile());
        assertSame(wife, second.getUserProfile());
        assertEquals(2, userAccountRepository.count());
    }

    @Test
    void enforcesUniqueNormalizedEmail() {
        Household household = householdRepository.save(household("Shared household"));
        UserProfile husband = userProfileRepository.save(profile("Husband", Gender.MALE));
        UserProfile wife = userProfileRepository.save(profile("Wife", Gender.FEMALE));
        userAccountRepository.saveAndFlush(account("purush@example.com", household, husband));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> userAccountRepository.saveAndFlush(
                        account("purush@example.com", household, wife)));
    }

    @Test
    void preventsAProfileFromBeingOwnedByMultipleAccounts() {
        Household household = householdRepository.save(household("Shared household"));
        UserProfile husband = userProfileRepository.save(profile("Husband", Gender.MALE));
        userAccountRepository.saveAndFlush(account("purush@example.com", household, husband));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> userAccountRepository.saveAndFlush(
                        account("another@example.com", household, husband)));
    }

    private Household household(String displayName) {
        Household household = new Household();
        household.setDisplayName(displayName);
        return household;
    }

    private UserProfile profile(String name, Gender gender) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setDisplayName(name);
        profile.setGender(gender);
        profile.setAge(30);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(80.0);
        profile.setCurrentWeightKg(78.0);
        profile.setTargetWeightKg(70.0);
        return profile;
    }

    private UserAccount account(String email, Household household, UserProfile profile) {
        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash("{bcrypt}development-test-hash");
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(profile);
        return account;
    }
}
