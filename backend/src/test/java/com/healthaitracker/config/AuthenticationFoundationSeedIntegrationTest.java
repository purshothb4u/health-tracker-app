package com.healthaitracker.config;

import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.CoupleChallengeRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:authentication-seed-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.seed-data.enabled=true",
        "app.seed-data.account-password=Phase11-Seed-Test-Only!"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class AuthenticationFoundationSeedIntegrationTest {

    private static final String SEED_PASSWORD = "Phase11-Seed-Test-Only!";

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private CoupleChallengeRepository challengeRepository;

    @Autowired
    private CoupleChallengeParticipantRepository participantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    @Qualifier("seedUserProfiles")
    private CommandLineRunner seedUserProfiles;

    @Test
    void seedsSharedHouseholdOwnershipSecurelyAndIdempotentlyWithoutProtectingApis() throws Exception {
        UserAccount husbandAccount = userAccountRepository.findByEmail("purush@healthaitracker.test")
                .orElseThrow();
        UserAccount wifeAccount = userAccountRepository.findByEmail("kasturi@healthaitracker.test")
                .orElseThrow();
        UserProfile husband = husbandAccount.getUserProfile();
        UserProfile wife = wifeAccount.getUserProfile();

        assertEquals(2, userAccountRepository.count());
        assertEquals(1, householdRepository.count());
        assertEquals("Husband", husband.getName());
        assertEquals("Purush", husband.getDisplayName());
        assertEquals("Wife", wife.getName());
        assertEquals("Kasturi", wife.getDisplayName());
        assertEquals(husbandAccount.getHousehold().getId(), wifeAccount.getHousehold().getId());
        assertNotEquals(SEED_PASSWORD, husbandAccount.getPasswordHash());
        assertNotEquals(SEED_PASSWORD, wifeAccount.getPasswordHash());
        assertTrue(passwordEncoder.matches(SEED_PASSWORD, husbandAccount.getPasswordHash()));
        assertTrue(passwordEncoder.matches(SEED_PASSWORD, wifeAccount.getPasswordHash()));

        Set<Long> challengeProfileIds = participantRepository.findAll().stream()
                .map(participant -> participant.getUserProfile().getId())
                .collect(Collectors.toSet());
        assertEquals(Set.of(husband.getId(), wife.getId()), challengeProfileIds);
        assertFalse(challengeRepository.findAll().isEmpty());

        long accountCount = userAccountRepository.count();
        long householdCount = householdRepository.count();
        long profileCount = userProfileRepository.count();
        long challengeCount = challengeRepository.count();
        long participantCount = participantRepository.count();
        Long husbandAccountId = husbandAccount.getId();
        Long wifeAccountId = wifeAccount.getId();
        String husbandHash = husbandAccount.getPasswordHash();
        String wifeHash = wifeAccount.getPasswordHash();

        seedUserProfiles.run(new String[0]);

        assertEquals(accountCount, userAccountRepository.count());
        assertEquals(householdCount, householdRepository.count());
        assertEquals(profileCount, userProfileRepository.count());
        assertEquals(challengeCount, challengeRepository.count());
        assertEquals(participantCount, participantRepository.count());
        UserAccount husbandAfterRestart = userAccountRepository.findByEmail("purush@healthaitracker.test")
                .orElseThrow();
        UserAccount wifeAfterRestart = userAccountRepository.findByEmail("kasturi@healthaitracker.test")
                .orElseThrow();
        assertEquals(husbandAccountId, husbandAfterRestart.getId());
        assertEquals(wifeAccountId, wifeAfterRestart.getId());
        assertEquals(husbandHash, husbandAfterRestart.getPasswordHash());
        assertEquals(wifeHash, wifeAfterRestart.getPasswordHash());

        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].displayName").exists())
                .andExpect(jsonPath("$[1].displayName").exists());
    }
}
