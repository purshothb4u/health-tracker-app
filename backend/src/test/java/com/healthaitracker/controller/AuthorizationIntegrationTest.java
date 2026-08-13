package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.ActivityCategory;
import com.healthaitracker.entity.ActivityEntry;
import com.healthaitracker.entity.ChallengeStatus;
import com.healthaitracker.entity.ChallengeType;
import com.healthaitracker.entity.CoupleChallenge;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalStatus;
import com.healthaitracker.entity.GoalType;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.MealType;
import com.healthaitracker.entity.SleepEntry;
import com.healthaitracker.entity.SleepType;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.entity.WaterEntry;
import com.healthaitracker.entity.WaterGoal;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.CoupleChallengeRepository;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.GoalRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.SleepEntryRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.repository.WaterEntryRepository;
import com.healthaitracker.repository.WaterGoalRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:authorization-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.seed-data.enabled=false",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class AuthorizationIntegrationTest {

    private static final String PASSWORD = "Milestone4-Test-Password!";
    private static final String PURUSH_EMAIL = "purush.authorization@example.com";
    private static final String KASTURI_EMAIL = "kasturi.authorization@example.com";
    private static final String OUTSIDER_EMAIL = "outsider.authorization@example.com";
    private static final String HOUSEHOLD_NONPARTICIPANT_EMAIL =
            "household.nonparticipant.authorization@example.com";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private WebApplicationContext webApplicationContext;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private HouseholdRepository householdRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;
    @Autowired
    private UserAccountRepository userAccountRepository;
    @Autowired
    private HealthMetricRepository healthMetricRepository;
    @Autowired
    private FoodEntryRepository foodEntryRepository;
    @Autowired
    private WaterGoalRepository waterGoalRepository;
    @Autowired
    private WaterEntryRepository waterEntryRepository;
    @Autowired
    private ActivityEntryRepository activityEntryRepository;
    @Autowired
    private SleepEntryRepository sleepEntryRepository;
    @Autowired
    private GoalRepository goalRepository;
    @Autowired
    private CoupleChallengeRepository challengeRepository;
    @Autowired
    private CoupleChallengeParticipantRepository participantRepository;

    private LocalDate today;
    private Household sharedHousehold;
    private UserProfile purush;
    private UserProfile kasturi;
    private UserProfile outsider;
    private HealthMetric kasturiMetric;
    private FoodEntry kasturiFood;
    private WaterEntry kasturiWater;
    private ActivityEntry kasturiActivity;
    private SleepEntry kasturiSleep;
    private Goal kasturiGoal;
    private CoupleChallenge sharedChallenge;

    @BeforeEach
    void setUp() {
        today = LocalDate.now();

        sharedHousehold = household("Shared authorization household");
        Household otherHousehold = household("Other authorization household");

        purush = userProfileRepository.save(profile("Husband", "Purush", Gender.MALE));
        kasturi = userProfileRepository.save(profile("Wife", "Kasturi", Gender.FEMALE));
        outsider = userProfileRepository.save(profile("Other", "Outsider", Gender.OTHER));

        userAccountRepository.save(account(PURUSH_EMAIL, purush, sharedHousehold));
        userAccountRepository.save(account(KASTURI_EMAIL, kasturi, sharedHousehold));
        userAccountRepository.save(account(OUTSIDER_EMAIL, outsider, otherHousehold));

        healthMetricRepository.save(metric(purush, "79.00"));
        kasturiMetric = healthMetricRepository.save(metric(kasturi, "64.00"));
        foodEntryRepository.save(food(purush, "Purush meal"));
        kasturiFood = foodEntryRepository.save(food(kasturi, "Kasturi meal"));
        waterGoalRepository.save(waterGoal(purush));
        waterGoalRepository.save(waterGoal(kasturi));
        waterEntryRepository.save(water(purush));
        kasturiWater = waterEntryRepository.save(water(kasturi));
        activityEntryRepository.save(activity(purush, "Purush walk"));
        kasturiActivity = activityEntryRepository.save(activity(kasturi, "Kasturi walk"));
        sleepEntryRepository.save(sleep(purush));
        kasturiSleep = sleepEntryRepository.save(sleep(kasturi));
        goalRepository.save(goal(purush, "Purush goal"));
        kasturiGoal = goalRepository.save(goal(kasturi, "Kasturi goal"));

        sharedChallenge = challengeRepository.save(challenge("Shared check-in challenge"));
        participantRepository.save(participant(sharedChallenge, purush));
        participantRepository.save(participant(sharedChallenge, kasturi));
    }

    @Test
    void unauthenticatedBusinessApiReturnsJsonUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    @Test
    void personalDomainsAllowSelfAndForbidAnotherProfile() throws Exception {
        AuthSession purushSession = authenticate(PURUSH_EMAIL);
        List<String> ownPaths = personalReadPaths(purush.getId());
        List<String> spousePaths = personalReadPaths(kasturi.getId());

        for (String path : ownPaths) {
            mockMvc.perform(get(path).session(purushSession.session()))
                    .andExpect(status().isOk());
        }
        for (String path : spousePaths) {
            mockMvc.perform(get(path).session(purushSession.session()))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value("Access denied"));
        }

        AuthSession kasturiSession = authenticate(KASTURI_EMAIL);
        mockMvc.perform(get("/api/users/{userId}/analytics", kasturi.getId())
                        .session(kasturiSession.session())
                        .param("from", today.toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/users/{userId}/analytics", purush.getId())
                        .session(kasturiSession.session())
                        .param("from", today.toString())
                        .param("to", today.toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void nestedForeignResourcesRemainIndistinguishableFromMissingResources() throws Exception {
        AuthSession purushSession = authenticate(PURUSH_EMAIL);
        List<String> foreignPaths = List.of(
                "/api/users/%d/food-entries/%d".formatted(purush.getId(), kasturiFood.getId()),
                "/api/users/%d/water-entries/%d".formatted(purush.getId(), kasturiWater.getId()),
                "/api/users/%d/activity-entries/%d".formatted(purush.getId(), kasturiActivity.getId()),
                "/api/users/%d/sleep-entries/%d".formatted(purush.getId(), kasturiSleep.getId()),
                "/api/users/%d/goals/%d".formatted(purush.getId(), kasturiGoal.getId()));

        for (String path : foreignPaths) {
            mockMvc.perform(get(path).session(purushSession.session()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", containsString("not found")));
        }

        mockMvc.perform(put("/api/users/{userId}/metrics/{metricId}",
                        purush.getId(),
                        kasturiMetric.getId())
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "metricDate", today,
                                "weightKg", new BigDecimal("78.50"),
                                "notes", "Should not be visible"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("not found")));
    }

    @Test
    void profileListEligibleParticipantsAndCsrfExposeOnlyAuthorizedData() throws Exception {
        AuthSession purushSession = authenticate(PURUSH_EMAIL);

        mockMvc.perform(get("/api/users").session(purushSession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(purush.getId()))
                .andExpect(jsonPath("$[0].displayName").value("Purush"));

        mockMvc.perform(get("/api/couple-challenges/eligible-participants")
                        .session(purushSession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].profileId").value(purush.getId()))
                .andExpect(jsonPath("$[0].displayName").value("Purush"))
                .andExpect(jsonPath("$[1].profileId").value(kasturi.getId()))
                .andExpect(jsonPath("$[1].displayName").value("Kasturi"))
                .andExpect(jsonPath("$[0].email").doesNotExist())
                .andExpect(jsonPath("$[0].accountId").doesNotExist())
                .andExpect(jsonPath("$[0].householdId").doesNotExist())
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[0].currentWeightKg").doesNotExist());

        String foodRequest = objectMapper.writeValueAsString(Map.of(
                "entryDate", today,
                "mealType", "SNACK",
                "foodName", "CSRF test snack",
                "quantity", 1,
                "unit", "serving",
                "calories", 100,
                "proteinGrams", 2,
                "carbohydrateGrams", 15,
                "fatGrams", 3));
        mockMvc.perform(post("/api/users/{userId}/food-entries", purush.getId())
                        .session(purushSession.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foodRequest))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/users/{userId}/food-entries", purush.getId())
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foodRequest))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/users")
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(profileRequest()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void coupleChallengesRequireParticipationAndSameHousehold() throws Exception {
        AuthSession purushSession = authenticate(PURUSH_EMAIL);
        AuthSession kasturiSession = authenticate(KASTURI_EMAIL);
        AuthSession outsiderSession = authenticate(OUTSIDER_EMAIL);
        UserProfile householdNonparticipant = userProfileRepository.save(
                profile("Household member", "Household nonparticipant", Gender.OTHER));
        userAccountRepository.save(account(
                HOUSEHOLD_NONPARTICIPANT_EMAIL,
                householdNonparticipant,
                sharedHousehold));
        AuthSession householdNonparticipantSession = authenticate(
                HOUSEHOLD_NONPARTICIPANT_EMAIL);

        mockMvc.perform(get("/api/couple-challenges").session(purushSession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(sharedChallenge.getId()));
        mockMvc.perform(get("/api/couple-challenges").session(kasturiSession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(sharedChallenge.getId()));
        mockMvc.perform(get("/api/couple-challenges/{challengeId}", sharedChallenge.getId())
                        .session(outsiderSession.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
        mockMvc.perform(get("/api/couple-challenges/{challengeId}", sharedChallenge.getId())
                        .session(householdNonparticipantSession.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        mockMvc.perform(post("/api/couple-challenges")
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(challengeRequest(
                                "Authorized challenge",
                                List.of(purush.getId(), kasturi.getId()))))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/couple-challenges")
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(challengeRequest(
                                "Cross-household challenge",
                                List.of(purush.getId(), outsider.getId()))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
        mockMvc.perform(post("/api/couple-challenges")
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(challengeRequest(
                                "Challenge excluding current profile",
                                List.of(kasturi.getId(), householdNonparticipant.getId()))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        mockMvc.perform(put("/api/couple-challenges/{challengeId}", sharedChallenge.getId())
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(challengeRequest(
                                "Updated shared challenge",
                                List.of(purush.getId(), kasturi.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated shared challenge"));

        mockMvc.perform(put("/api/couple-challenges/{challengeId}/participants/{userId}/check-ins/{date}",
                        sharedChallenge.getId(),
                        kasturi.getId(),
                        today)
                        .session(purushSession.session())
                        .cookie(purushSession.csrf().cookie())
                        .header(purushSession.csrf().headerName(), purushSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true,\"notes\":\"Shared household check-in\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/couple-challenges/{challengeId}/participants/{userId}/check-ins/{date}",
                        sharedChallenge.getId(),
                        kasturi.getId(),
                        today)
                        .session(outsiderSession.session())
                        .cookie(outsiderSession.csrf().cookie())
                        .header(outsiderSession.csrf().headerName(), outsiderSession.csrf().token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        mockMvc.perform(get("/api/users/{userId}/couple-achievements", kasturi.getId())
                        .session(purushSession.session()))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/users/{userId}/couple-achievements", purush.getId())
                        .session(outsiderSession.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    private List<String> personalReadPaths(Long profileId) {
        return List.of(
                "/api/users/" + profileId,
                "/api/users/" + profileId + "/metrics",
                "/api/users/" + profileId + "/summary",
                "/api/users/" + profileId + "/food-entries?date=" + today,
                "/api/users/" + profileId + "/nutrition-summary?date=" + today,
                "/api/users/" + profileId + "/water-goal",
                "/api/users/" + profileId + "/water-entries?date=" + today,
                "/api/users/" + profileId + "/hydration-summary?date=" + today,
                "/api/users/" + profileId + "/activity-entries?date=" + today,
                "/api/users/" + profileId + "/activity-summary?date=" + today,
                "/api/users/" + profileId + "/sleep-entries?date=" + today,
                "/api/users/" + profileId + "/sleep-summary?date=" + today,
                "/api/users/" + profileId + "/goals",
                "/api/users/" + profileId + "/goal-achievements",
                "/api/users/" + profileId + "/analytics?from=" + today + "&to=" + today);
    }

    private AuthSession authenticate(String email) throws Exception {
        MockHttpSession preLoginSession = new MockHttpSession(
                webApplicationContext.getServletContext());
        CsrfExchange preLoginCsrf = getCsrf(preLoginSession);
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .session(preLoginSession)
                        .cookie(preLoginCsrf.cookie())
                        .header(preLoginCsrf.headerName(), preLoginCsrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession authenticatedSession =
                (MockHttpSession) loginResult.getRequest().getSession(false);
        return new AuthSession(authenticatedSession, getCsrf(authenticatedSession));
    }

    private CsrfExchange getCsrf(MockHttpSession session) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf").session(session))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        return new CsrfExchange(
                body.get("headerName").asText(),
                body.get("token").asText(),
                cookie);
    }

    private Household household(String displayName) {
        Household household = new Household();
        household.setDisplayName(displayName);
        return householdRepository.save(household);
    }

    private UserProfile profile(String name, String displayName, Gender gender) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setDisplayName(displayName);
        profile.setGender(gender);
        profile.setAge(35);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(80.0);
        profile.setCurrentWeightKg(79.0);
        profile.setTargetWeightKg(72.0);
        return profile;
    }

    private UserAccount account(String email, UserProfile profile, Household household) {
        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(PASSWORD));
        account.setEnabled(true);
        account.setUserProfile(profile);
        account.setHousehold(household);
        return account;
    }

    private HealthMetric metric(UserProfile profile, String weightKg) {
        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(profile);
        metric.setMetricDate(today);
        metric.setWeightKg(new BigDecimal(weightKg));
        return metric;
    }

    private FoodEntry food(UserProfile profile, String foodName) {
        FoodEntry entry = new FoodEntry();
        entry.setUserProfile(profile);
        entry.setEntryDate(today);
        entry.setMealType(MealType.BREAKFAST);
        entry.setFoodName(foodName);
        entry.setQuantity(BigDecimal.ONE);
        entry.setUnit("serving");
        entry.setCalories(new BigDecimal("300.00"));
        entry.setProteinG(new BigDecimal("20.00"));
        entry.setCarbohydratesG(new BigDecimal("35.00"));
        entry.setFatG(new BigDecimal("8.00"));
        return entry;
    }

    private WaterGoal waterGoal(UserProfile profile) {
        WaterGoal goal = new WaterGoal();
        goal.setUserProfile(profile);
        goal.setDailyGoalMl(2_000);
        return goal;
    }

    private WaterEntry water(UserProfile profile) {
        WaterEntry entry = new WaterEntry();
        entry.setUserProfile(profile);
        entry.setEntryDate(today);
        entry.setAmountMl(500);
        return entry;
    }

    private ActivityEntry activity(UserProfile profile, String name) {
        ActivityEntry entry = new ActivityEntry();
        entry.setUserProfile(profile);
        entry.setActivityDate(today);
        entry.setCategory(ActivityCategory.WALKING);
        entry.setActivityName(name);
        entry.setDurationMinutes(30);
        return entry;
    }

    private SleepEntry sleep(UserProfile profile) {
        SleepEntry entry = new SleepEntry();
        entry.setUserProfile(profile);
        entry.setSleepDate(today);
        entry.setSleepType(SleepType.NIGHT_SLEEP);
        entry.setStartDateTime(today.minusDays(1).atTime(23, 0));
        entry.setEndDateTime(today.atTime(7, 0));
        return entry;
    }

    private Goal goal(UserProfile profile, String title) {
        Goal goal = new Goal();
        goal.setUserProfile(profile);
        goal.setTitle(title);
        goal.setGoalType(GoalType.ACTIVITY_MINUTES);
        goal.setStartDate(today.minusDays(1));
        goal.setEndDate(today.plusDays(1));
        goal.setTargetValue(60L);
        goal.setStatus(GoalStatus.ACTIVE);
        return goal;
    }

    private CoupleChallenge challenge(String title) {
        CoupleChallenge challenge = new CoupleChallenge();
        challenge.setTitle(title);
        challenge.setChallengeType(ChallengeType.CUSTOM_CHECK_IN);
        challenge.setStartDate(today.minusDays(1));
        challenge.setEndDate(today.plusDays(1));
        challenge.setTargetValue(2L);
        challenge.setCustomUnit("check-ins");
        challenge.setStatus(ChallengeStatus.ACTIVE);
        return challenge;
    }

    private CoupleChallengeParticipant participant(
            CoupleChallenge challenge,
            UserProfile profile) {
        CoupleChallengeParticipant participant = new CoupleChallengeParticipant();
        participant.setCoupleChallenge(challenge);
        participant.setUserProfile(profile);
        return participant;
    }

    private String challengeRequest(String title, List<Long> participantIds) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "title", title,
                "challengeType", "CUSTOM_CHECK_IN",
                "startDate", today.minusDays(1),
                "endDate", today.plusDays(1),
                "targetValue", 2,
                "customUnit", "check-ins",
                "participantUserProfileIds", participantIds));
    }

    private String profileRequest() throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "name", "Forbidden profile",
                "gender", "OTHER",
                "age", 35,
                "heightCm", 170,
                "startingWeightKg", 80,
                "currentWeightKg", 80,
                "targetWeightKg", 75));
    }

    private record CsrfExchange(String headerName, String token, Cookie cookie) {
    }

    private record AuthSession(MockHttpSession session, CsrfExchange csrf) {
    }
}
