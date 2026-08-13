package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.ProfileGoalType;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:profile-onboarding-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.seed-data.enabled=false",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class ProfileOnboardingControllerIntegrationTest {

    private static final String PASSWORD = "Milestone5-Test-Password!";
    private static final String PURUSH_EMAIL = "purush.onboarding@example.com";
    private static final String KASTURI_EMAIL = "kasturi.onboarding@example.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private HealthMetricRepository healthMetricRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserProfile purush;
    private UserProfile kasturi;

    @BeforeEach
    void setUp() {
        Household household = new Household();
        household.setDisplayName("Onboarding test household");
        household = householdRepository.save(household);

        purush = userProfileRepository.save(profile("Husband", "Purush", Gender.MALE, 82.0));
        kasturi = userProfileRepository.save(profile("Wife", "Kasturi", Gender.FEMALE, 68.0));
        userAccountRepository.save(account(PURUSH_EMAIL, purush, household));
        userAccountRepository.saveAndFlush(account(KASTURI_EMAIL, kasturi, household));
    }

    @Test
    void incompleteIdentityAndOnboardingReadUseAuthenticatedProfile() throws Exception {
        AuthenticatedSession session = login(PURUSH_EMAIL);

        mockMvc.perform(get("/api/auth/me").session(session.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileId").value(purush.getId()))
                .andExpect(jsonPath("$.profileComplete").value(false));

        mockMvc.perform(get("/api/profile-onboarding")
                        .queryParam("userId", kasturi.getId().toString())
                        .session(session.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileId").value(purush.getId()))
                .andExpect(jsonPath("$.displayName").value("Purush"))
                .andExpect(jsonPath("$.dateOfBirth").doesNotExist())
                .andExpect(jsonPath("$.profileComplete").value(false))
                .andExpect(jsonPath("$.hasWeightHistory").value(false));
    }

    @Test
    void completingProfileWithoutWeightHistoryCreatesInitialMetricAndRefreshesIdentity() throws Exception {
        AuthenticatedSession session = login(PURUSH_EMAIL);
        LocalDate dateOfBirth = LocalDate.now().minusYears(34).minusDays(10);

        mockMvc.perform(put("/api/profile-onboarding")
                        .session(session.session())
                        .cookie(session.csrf().cookie())
                        .header(session.csrf().headerName(), session.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProfileJson("Purush Kumar", dateOfBirth, 82.25)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileId").value(purush.getId()))
                .andExpect(jsonPath("$.displayName").value("Purush Kumar"))
                .andExpect(jsonPath("$.age").value(34))
                .andExpect(jsonPath("$.activityLevel").value("MODERATELY_ACTIVE"))
                .andExpect(jsonPath("$.goalType").value("MAINTAIN_WEIGHT"))
                .andExpect(jsonPath("$.profileComplete").value(true))
                .andExpect(jsonPath("$.hasWeightHistory").value(true));

        UserProfile savedProfile = userProfileRepository.findById(purush.getId()).orElseThrow();
        assertEquals("Husband", savedProfile.getName());
        assertEquals("Purush Kumar", savedProfile.getDisplayName());
        assertEquals(dateOfBirth, savedProfile.getDateOfBirth());
        assertEquals(82.25, savedProfile.getStartingWeightKg());
        assertEquals(82.25, savedProfile.getCurrentWeightKg());
        HealthMetric initialMetric = healthMetricRepository
                .findFirstByUserProfileIdOrderByMetricDateDesc(purush.getId())
                .orElseThrow();
        assertEquals(LocalDate.now(), initialMetric.getMetricDate());
        assertEquals(0, new BigDecimal("82.25").compareTo(initialMetric.getWeightKg()));

        mockMvc.perform(get("/api/auth/me").session(session.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Purush Kumar"))
                .andExpect(jsonPath("$.profileComplete").value(true));

        assertEquals("Kasturi", userProfileRepository.findById(kasturi.getId())
                .orElseThrow().getDisplayName());
    }

    @Test
    void existingWeightHistoryRemainsAuthoritativeAndCannotBeRewrittenByProfileSetup() throws Exception {
        HealthMetric existingMetric = new HealthMetric();
        existingMetric.setUserProfile(purush);
        existingMetric.setMetricDate(LocalDate.now().minusDays(2));
        existingMetric.setWeightKg(new BigDecimal("79.50"));
        existingMetric.setNotes("Existing weight history");
        existingMetric = healthMetricRepository.saveAndFlush(existingMetric);
        purush.setCurrentWeightKg(79.5);
        userProfileRepository.saveAndFlush(purush);

        AuthenticatedSession session = login(PURUSH_EMAIL);
        LocalDate dateOfBirth = LocalDate.now().minusYears(34).minusDays(10);

        mockMvc.perform(put("/api/profile-onboarding")
                        .session(session.session())
                        .cookie(session.csrf().cookie())
                        .header(session.csrf().headerName(), session.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProfileJson("Purush", dateOfBirth, 79.50)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentWeightKg").value(79.5))
                .andExpect(jsonPath("$.hasWeightHistory").value(true));

        assertEquals(1, healthMetricRepository
                .findByUserProfileIdOrderByMetricDateDesc(purush.getId()).size());
        HealthMetric unchanged = healthMetricRepository.findById(existingMetric.getId()).orElseThrow();
        assertEquals(new BigDecimal("79.50"), unchanged.getWeightKg());
        assertEquals(LocalDate.now().minusDays(2), unchanged.getMetricDate());

        mockMvc.perform(put("/api/profile-onboarding")
                        .session(session.session())
                        .cookie(session.csrf().cookie())
                        .header(session.csrf().headerName(), session.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProfileJson("Purush", dateOfBirth, 80.0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.currentWeightKg").value(
                        "Current weight must match the latest health metric. Update weight from the Health page."));
    }

    @Test
    void invalidRequiredAndStructuralFieldsReturnFieldErrors() throws Exception {
        AuthenticatedSession session = login(PURUSH_EMAIL);
        Map<String, Object> invalid = new LinkedHashMap<>();
        invalid.put("displayName", " ");
        invalid.put("sex", null);
        invalid.put("dateOfBirth", LocalDate.now().plusDays(1).toString());
        invalid.put("heightCm", 0);
        invalid.put("currentWeightKg", -1);
        invalid.put("targetWeightKg", 0);
        invalid.put("activityLevel", null);
        invalid.put("goalType", null);

        mockMvc.perform(put("/api/profile-onboarding")
                        .session(session.session())
                        .cookie(session.csrf().cookie())
                        .header(session.csrf().headerName(), session.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.displayName").exists())
                .andExpect(jsonPath("$.errors.sex").exists())
                .andExpect(jsonPath("$.errors.dateOfBirth").exists())
                .andExpect(jsonPath("$.errors.heightCm").exists())
                .andExpect(jsonPath("$.errors.currentWeightKg").exists())
                .andExpect(jsonPath("$.errors.targetWeightKg").exists())
                .andExpect(jsonPath("$.errors.activityLevel").exists())
                .andExpect(jsonPath("$.errors.goalType").exists());
    }

    private AuthenticatedSession login(String email) throws Exception {
        MockHttpSession preLoginSession = new MockHttpSession(webApplicationContext.getServletContext());
        CsrfExchange preLoginCsrf = csrf(preLoginSession);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .session(preLoginSession)
                        .cookie(preLoginCsrf.cookie())
                        .header(preLoginCsrf.headerName(), preLoginCsrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession authenticatedSession = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(authenticatedSession);
        return new AuthenticatedSession(authenticatedSession, csrf(authenticatedSession));
    }

    private CsrfExchange csrf(MockHttpSession session) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf").session(session))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(cookie);
        return new CsrfExchange(
                response.get("headerName").asText(),
                response.get("token").asText(),
                cookie);
    }

    private String validProfileJson(
            String displayName,
            LocalDate dateOfBirth,
            double currentWeightKg) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "displayName", displayName,
                "sex", "MALE",
                "dateOfBirth", dateOfBirth.toString(),
                "heightCm", 178.0,
                "currentWeightKg", currentWeightKg,
                "targetWeightKg", 78.0,
                "activityLevel", ActivityLevel.MODERATELY_ACTIVE.name(),
                "goalType", ProfileGoalType.MAINTAIN_WEIGHT.name()));
    }

    private UserProfile profile(
            String name,
            String displayName,
            Gender gender,
            double currentWeightKg) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setDisplayName(displayName);
        profile.setGender(gender);
        profile.setAge(34);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(currentWeightKg);
        profile.setCurrentWeightKg(currentWeightKg);
        profile.setTargetWeightKg(currentWeightKg - 5);
        return profile;
    }

    private UserAccount account(String email, UserProfile profile, Household household) {
        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(PASSWORD));
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(profile);
        return account;
    }

    private record AuthenticatedSession(MockHttpSession session, CsrfExchange csrf) {
    }

    private record CsrfExchange(String headerName, String token, Cookie cookie) {
    }
}
