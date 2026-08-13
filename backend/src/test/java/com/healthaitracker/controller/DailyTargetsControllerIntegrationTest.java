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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:daily-targets-controller-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.seed-data.enabled=false",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class DailyTargetsControllerIntegrationTest {

    private static final String PASSWORD = "Milestone6-Test-Password!";
    private static final String PURUSH_EMAIL = "purush.targets@example.com";

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
        household.setDisplayName("Daily target test household");
        household = householdRepository.save(household);

        purush = userProfileRepository.save(profile(
                "Husband", "Purush", Gender.MALE, 30,
                90.0, ActivityLevel.MODERATELY_ACTIVE, ProfileGoalType.MAINTAIN_WEIGHT));
        kasturi = userProfileRepository.save(profile(
                "Wife", "Kasturi", Gender.FEMALE, 32,
                68.0, ActivityLevel.LIGHTLY_ACTIVE, ProfileGoalType.LOSE_WEIGHT));
        userAccountRepository.save(account(PURUSH_EMAIL, purush, household));
        userAccountRepository.saveAndFlush(account(
                "kasturi.targets@example.com", kasturi, household));
        healthMetricRepository.save(metric(purush, "80.00"));
        healthMetricRepository.saveAndFlush(metric(kasturi, "63.00"));
    }

    @Test
    void authenticatedEndpointReturnsOnlyTheCurrentProfilesTargets() throws Exception {
        MockHttpSession session = login(PURUSH_EMAIL);

        mockMvc.perform(get("/api/daily-targets")
                        .queryParam("userId", kasturi.getId().toString())
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.age").value(30))
                .andExpect(jsonPath("$.currentWeightKg").value(80.0))
                .andExpect(jsonPath("$.activityLevel").value("MODERATELY_ACTIVE"))
                .andExpect(jsonPath("$.usedLegacyActivityFallback").value(false))
                .andExpect(jsonPath("$.goalType").value("MAINTAIN_WEIGHT"))
                .andExpect(jsonPath("$.adultEligible").value(true))
                .andExpect(jsonPath("$.bmrKcal").value(1749))
                .andExpect(jsonPath("$.estimatedMaintenanceKcal").value(2711))
                .andExpect(jsonPath("$.estimatedCalorieTargetKcal").value(2711))
                .andExpect(jsonPath("$.proteinTargetG").value(169.4))
                .andExpect(jsonPath("$.carbohydrateTargetG").value(305.0))
                .andExpect(jsonPath("$.fatTargetG").value(90.4))
                .andExpect(jsonPath("$.estimatedHydrationMl").value(3000))
                .andExpect(jsonPath("$.calorieTargetsAvailable").value(true))
                .andExpect(jsonPath("$.hydrationEstimateAvailable").value(true))
                .andExpect(jsonPath("$.profileId").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.accountId").doesNotExist())
                .andExpect(jsonPath("$.householdId").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void endpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/daily-targets"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    private MockHttpSession login(String email) throws Exception {
        MockHttpSession preLoginSession = new MockHttpSession(webApplicationContext.getServletContext());
        MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf").session(preLoginSession))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode csrfResponse = objectMapper.readTree(csrfResult.getResponse().getContentAsString());
        Cookie csrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(csrfCookie);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .session(preLoginSession)
                        .cookie(csrfCookie)
                        .header(
                                csrfResponse.get("headerName").asText(),
                                csrfResponse.get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession authenticatedSession =
                (MockHttpSession) loginResult.getRequest().getSession(false);
        assertNotNull(authenticatedSession);
        return authenticatedSession;
    }

    private UserProfile profile(
            String name,
            String displayName,
            Gender gender,
            int age,
            double currentWeightKg,
            ActivityLevel activityLevel,
            ProfileGoalType goalType) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setDisplayName(displayName);
        profile.setGender(gender);
        profile.setAge(age);
        profile.setDateOfBirth(LocalDate.now().minusYears(age));
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(currentWeightKg);
        profile.setCurrentWeightKg(currentWeightKg);
        profile.setTargetWeightKg(currentWeightKg - 5);
        profile.setActivityLevel(activityLevel);
        profile.setGoalType(goalType);
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

    private HealthMetric metric(UserProfile profile, String weightKg) {
        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(profile);
        metric.setMetricDate(LocalDate.now());
        metric.setWeightKg(new BigDecimal(weightKg));
        metric.setNotes("Daily target integration test");
        return metric;
    }
}
