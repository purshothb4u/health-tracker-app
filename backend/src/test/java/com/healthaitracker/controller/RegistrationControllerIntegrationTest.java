package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.service.ProfileCompletenessService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:registration-controller-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "app.seed-data.enabled=false",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RegistrationControllerIntegrationTest {

    private static final String PASSWORD = "registration-test-password";
    private static final String NORMALIZED_EMAIL = "new.user@example.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @SpyBean
    private UserAccountRepository userAccountRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private HealthMetricRepository healthMetricRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ProfileCompletenessService profileCompletenessService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanRegistrationData() {
        healthMetricRepository.deleteAll();
        userAccountRepository.deleteAll();
        userProfileRepository.deleteAll();
        householdRepository.deleteAll();
    }

    @Test
    void registersFreshAccountEstablishesSessionAndCompletesOnboarding() throws Exception {
        MockHttpSession preRegistrationSession = new MockHttpSession(
                webApplicationContext.getServletContext());
        String preRegistrationSessionId = preRegistrationSession.getId();
        CsrfExchange csrf = csrf(preRegistrationSession);

        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .session(preRegistrationSession)
                        .cookie(csrf.cookie())
                        .header(csrf.headerName(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("  New.User@Example.COM  ", PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(NORMALIZED_EMAIL))
                .andExpect(jsonPath("$.displayName").value(nullValue()))
                .andExpect(jsonPath("$.profileComplete").value(false))
                .andReturn();

        MockHttpSession authenticatedSession = sessionFrom(registration);
        assertNotEquals(preRegistrationSessionId, authenticatedSession.getId());

        UserAccount account = userAccountRepository.findByEmail(NORMALIZED_EMAIL).orElseThrow();
        UserProfile profile = userProfileRepository.findById(
                account.getUserProfile().getId()).orElseThrow();
        Household household = householdRepository.findById(
                account.getHousehold().getId()).orElseThrow();

        assertNotEquals(PASSWORD, account.getPasswordHash());
        assertTrue(passwordEncoder.matches(PASSWORD, account.getPasswordHash()));
        assertEquals(1, userAccountRepository.findByHouseholdIdOrderByUserProfileIdAsc(
                household.getId()).size());
        assertEquals("Personal household", household.getDisplayName());
        assertTrue(profile.getName().startsWith("Account profile "));
        assertNotEquals("Husband", profile.getName());
        assertNotEquals("Wife", profile.getName());
        assertNull(profile.getDisplayName());
        assertNull(profile.getGender());
        assertNull(profile.getAge());
        assertNull(profile.getHeightCm());
        assertNull(profile.getStartingWeightKg());
        assertNull(profile.getCurrentWeightKg());
        assertNull(profile.getTargetWeightKg());
        assertFalse(profileCompletenessService.isComplete(profile));

        assertFreshTrackingData();

        mockMvc.perform(get("/api/auth/me").session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(NORMALIZED_EMAIL))
                .andExpect(jsonPath("$.profileId").value(profile.getId()))
                .andExpect(jsonPath("$.displayName").value(nullValue()))
                .andExpect(jsonPath("$.profileComplete").value(false));

        mockMvc.perform(get("/api/profile-onboarding").session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileId").value(profile.getId()))
                .andExpect(jsonPath("$.sex").value(nullValue()))
                .andExpect(jsonPath("$.age").value(nullValue()))
                .andExpect(jsonPath("$.heightCm").value(nullValue()))
                .andExpect(jsonPath("$.currentWeightKg").value(nullValue()))
                .andExpect(jsonPath("$.targetWeightKg").value(nullValue()))
                .andExpect(jsonPath("$.profileComplete").value(false));

        mockMvc.perform(get("/api/users/{userId}", profile.getId())
                        .session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value(nullValue()))
                .andExpect(jsonPath("$.gender").value(nullValue()))
                .andExpect(jsonPath("$.age").value(nullValue()))
                .andExpect(jsonPath("$.heightCm").value(nullValue()))
                .andExpect(jsonPath("$.startingWeightKg").value(nullValue()))
                .andExpect(jsonPath("$.currentWeightKg").value(nullValue()))
                .andExpect(jsonPath("$.targetWeightKg").value(nullValue()))
                .andExpect(jsonPath("$.weightLostKg").value(nullValue()))
                .andExpect(jsonPath("$.weightRemainingKg").value(nullValue()))
                .andExpect(jsonPath("$.goalProgressPercent").value(nullValue()));

        mockMvc.perform(get("/api/users/{userId}/goal-achievements", profile.getId())
                        .session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/users/{userId}/couple-achievements", profile.getId())
                        .session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        UserProfile foreignProfile = userProfileRepository.saveAndFlush(completeProfile("Other profile"));
        Household foreignHousehold = householdRepository.saveAndFlush(household("Other household"));
        userAccountRepository.saveAndFlush(account(
                "other@example.com",
                foreignHousehold,
                foreignProfile));
        mockMvc.perform(get("/api/users/{userId}", foreignProfile.getId())
                        .session(authenticatedSession))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        CsrfExchange authenticatedCsrf = csrf(authenticatedSession);
        LocalDate dateOfBirth = LocalDate.now().minusYears(32).minusDays(1);
        mockMvc.perform(put("/api/profile-onboarding")
                        .session(authenticatedSession)
                        .cookie(authenticatedCsrf.cookie())
                        .header(authenticatedCsrf.headerName(), authenticatedCsrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(onboardingJson("Registered User", dateOfBirth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Registered User"))
                .andExpect(jsonPath("$.sex").value("OTHER"))
                .andExpect(jsonPath("$.age").value(32))
                .andExpect(jsonPath("$.heightCm").value(171.5))
                .andExpect(jsonPath("$.currentWeightKg").value(72.25))
                .andExpect(jsonPath("$.targetWeightKg").value(68.0))
                .andExpect(jsonPath("$.profileComplete").value(true));

        UserProfile completedProfile = userProfileRepository.findById(profile.getId()).orElseThrow();
        assertTrue(profileCompletenessService.isComplete(completedProfile));
        assertEquals(1, healthMetricRepository.count());
        mockMvc.perform(get("/api/auth/me").session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Registered User"))
                .andExpect(jsonPath("$.profileComplete").value(true));
    }

    @Test
    void rejectsNormalizedDuplicateEmailWithoutCreatingAnotherOwnershipGraph() throws Exception {
        register("New.User@Example.com", PASSWORD).andExpect(status().isCreated());

        register("  new.user@example.COM ", PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "An account already exists for this email"));

        assertEquals(1, userAccountRepository.count());
        assertEquals(1, userProfileRepository.count());
        assertEquals(1, householdRepository.count());
    }

    @Test
    void requiresCsrfAndRejectsUnsafePasswordLengths() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(NORMALIZED_EMAIL, PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        register(NORMALIZED_EMAIL, "short")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
        register(NORMALIZED_EMAIL, "a".repeat(73))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
        register(NORMALIZED_EMAIL, "😀".repeat(20))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Password must not exceed 72 UTF-8 bytes"));

        assertEquals(0, userAccountRepository.count());
        assertEquals(0, userProfileRepository.count());
        assertEquals(0, householdRepository.count());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void rollsBackHouseholdAndProfileWhenAccountPersistenceFails() throws Exception {
        doThrow(new DataIntegrityViolationException("Forced registration failure"))
                .when(userAccountRepository).saveAndFlush(any(UserAccount.class));

        register(NORMALIZED_EMAIL, PASSWORD)
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));

        assertEquals(0, userAccountRepository.count());
        assertEquals(0, userProfileRepository.count());
        assertEquals(0, householdRepository.count());
    }

    private org.springframework.test.web.servlet.ResultActions register(String email, String password)
            throws Exception {
        MockHttpSession session = new MockHttpSession(webApplicationContext.getServletContext());
        CsrfExchange csrf = csrf(session);
        return mockMvc.perform(post("/api/auth/register")
                .session(session)
                .cookie(csrf.cookie())
                .header(csrf.headerName(), csrf.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(registrationJson(email, password)));
    }

    private CsrfExchange csrf(MockHttpSession session) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf").session(session))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(cookie);
        return new CsrfExchange(
                body.get("headerName").asText(),
                body.get("token").asText(),
                cookie);
    }

    private MockHttpSession sessionFrom(MvcResult result) {
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session);
        return session;
    }

    private String registrationJson(String email, String password) throws Exception {
        return objectMapper.writeValueAsString(Map.of("email", email, "password", password));
    }

    private String onboardingJson(String displayName, LocalDate dateOfBirth) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "displayName", displayName,
                "sex", "OTHER",
                "dateOfBirth", dateOfBirth,
                "heightCm", 171.5,
                "currentWeightKg", 72.25,
                "targetWeightKg", 68.0,
                "activityLevel", "MODERATELY_ACTIVE",
                "goalType", "MAINTAIN_WEIGHT"));
    }

    private void assertFreshTrackingData() {
        List<String> trackingTables = List.of(
                "health_metrics",
                "food_entries",
                "water_goals",
                "water_entries",
                "activity_entries",
                "sleep_entries",
                "goals",
                "goal_check_ins",
                "couple_challenges",
                "couple_challenge_participants",
                "challenge_check_ins");
        for (String table : trackingTables) {
            assertEquals(0, jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM " + table,
                    Integer.class));
        }
    }

    private Household household(String displayName) {
        Household household = new Household();
        household.setDisplayName(displayName);
        return household;
    }

    private UserProfile completeProfile(String displayName) {
        UserProfile profile = new UserProfile();
        profile.setName(displayName);
        profile.setDisplayName(displayName);
        profile.setGender(Gender.OTHER);
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
        account.setPasswordHash(passwordEncoder.encode(PASSWORD));
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(profile);
        return account;
    }

    private record CsrfExchange(String headerName, String token, Cookie cookie) {
    }
}
