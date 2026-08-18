package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.ChallengeCheckInRepository;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.CoupleChallengeRepository;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.GoalCheckInRepository;
import com.healthaitracker.repository.GoalRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.SleepEntryRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.repository.WaterEntryRepository;
import com.healthaitracker.repository.WaterGoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class GoalControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ChallengeCheckInRepository challengeCheckInRepository;
    @Autowired
    private CoupleChallengeParticipantRepository participantRepository;
    @Autowired
    private CoupleChallengeRepository challengeRepository;
    @Autowired
    private GoalCheckInRepository goalCheckInRepository;
    @Autowired
    private GoalRepository goalRepository;
    @Autowired
    private ActivityEntryRepository activityEntryRepository;
    @Autowired
    private SleepEntryRepository sleepEntryRepository;
    @Autowired
    private WaterEntryRepository waterEntryRepository;
    @Autowired
    private WaterGoalRepository waterGoalRepository;
    @Autowired
    private FoodEntryRepository foodEntryRepository;
    @Autowired
    private HealthMetricRepository healthMetricRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;
    @Autowired
    private UserAccountRepository userAccountRepository;
    @Autowired
    private HouseholdRepository householdRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private WebApplicationContext applicationContext;

    private Long husbandId;
    private Long wifeId;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        challengeCheckInRepository.deleteAll();
        participantRepository.deleteAll();
        challengeRepository.deleteAll();
        goalCheckInRepository.deleteAll();
        goalRepository.deleteAll();
        activityEntryRepository.deleteAll();
        sleepEntryRepository.deleteAll();
        waterEntryRepository.deleteAll();
        waterGoalRepository.deleteAll();
        foodEntryRepository.deleteAll();
        healthMetricRepository.deleteAll();
        userAccountRepository.deleteAll();
        householdRepository.deleteAll();
        userProfileRepository.deleteAll();
        UserProfile husband = userProfileRepository.save(profile("Husband", Gender.MALE));
        husbandId = husband.getId();
        wifeId = userProfileRepository.save(profile("Wife", Gender.FEMALE)).getId();
        Household household = ControllerTestAuthentication.createHousehold(
                householdRepository,
                "Goal controller test household");
        UserAccount account = ControllerTestAuthentication.createAccount(
                userAccountRepository,
                passwordEncoder,
                household,
                husband,
                "goal.controller@example.com");
        mockMvc = ControllerTestAuthentication.authenticatedMockMvc(applicationContext, account);
        today = LocalDate.now();
    }

    @Test
    void createsRetrievesUpdatesAndDeletesAnOwnedGoal() throws Exception {
        Long goalId = createGoal(
                husbandId,
                goalRequest("Activity goal", "ACTIVITY_MINUTES", 300L, null, null));

        mockMvc.perform(get("/api/users/{userId}/goals/{goalId}", husbandId, goalId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(goalId))
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.displayUnit").value("minutes"));

        Map<String, Object> update = goalRequest(
                "  Updated activity goal  ", "ACTIVITY_MINUTES", 500L, null, null);
        update.put("notes", "  Steady progress  ");
        mockMvc.perform(put("/api/users/{userId}/goals/{goalId}", husbandId, goalId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(goalId))
                .andExpect(jsonPath("$.title").value("Updated activity goal"))
                .andExpect(jsonPath("$.targetValue").value(500))
                .andExpect(jsonPath("$.notes").value("Steady progress"));

        mockMvc.perform(delete("/api/users/{userId}/goals/{goalId}", husbandId, goalId))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        mockMvc.perform(get("/api/users/{userId}/goals/{goalId}", husbandId, goalId))
                .andExpect(status().isNotFound());
    }

    @Test
    void transitionsStatusFiltersGoalsAndReturnsGoalAchievement() throws Exception {
        Long activeGoalId = createGoal(
                husbandId,
                goalRequest("Active", "ACTIVITY_MINUTES", 100L, null, null));
        Long completedGoalId = createGoal(
                husbandId,
                goalRequest("Complete", "ACTIVITY_MINUTES", 100L, null, null));

        mockMvc.perform(put("/api/users/{userId}/goals/{goalId}/status", husbandId, completedGoalId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedAt").exists());

        mockMvc.perform(get("/api/users/{userId}/goals", husbandId).param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(activeGoalId));
        mockMvc.perform(get("/api/users/{userId}/goals", husbandId).param("status", "COMPLETED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(completedGoalId));

        mockMvc.perform(get("/api/users/{userId}/goal-achievements", husbandId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].achievementType").value("FIRST_GOAL_COMPLETED"))
                .andExpect(jsonPath("$[0].goalId").value(completedGoalId));
    }

    @Test
    void upsertsCustomCheckInAndReturnsProgressWithDerivedPoints() throws Exception {
        Long goalId = createGoal(
                husbandId,
                goalRequest("Daily check-in", "CUSTOM_CHECK_IN", 1L, null, "sessions"));

        String firstBody = mockMvc.perform(put(
                                "/api/users/{userId}/goals/{goalId}/check-ins/{date}",
                                husbandId,
                                goalId,
                                today)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true,\"notes\":\" First \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.notes").value("First"))
                .andReturn().getResponse().getContentAsString();
        Long checkInId = objectMapper.readTree(firstBody).get("id").asLong();

        mockMvc.perform(put(
                                "/api/users/{userId}/goals/{goalId}/check-ins/{date}",
                                husbandId,
                                goalId,
                                today)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true,\"notes\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(checkInId))
                .andExpect(jsonPath("$.notes").value("Updated"));

        mockMvc.perform(get("/api/users/{userId}/goals/{goalId}/progress", husbandId, goalId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentValue").value(1))
                .andExpect(jsonPath("$.targetValue").value(1))
                .andExpect(jsonPath("$.displayUnit").value("sessions"))
                .andExpect(jsonPath("$.progressPercentage").value(100.00))
                .andExpect(jsonPath("$.points").value(20))
                .andExpect(jsonPath("$.goalReached").value(true));
    }

    @Test
    void protectsGoalOwnershipAcrossProfiles() throws Exception {
        Long goalId = createGoal(
                husbandId,
                goalRequest("Private", "ACTIVITY_MINUTES", 100L, null, null));

        mockMvc.perform(get("/api/users/{userId}/goals/{goalId}", wifeId, goalId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
        mockMvc.perform(get("/api/users/{userId}/goals/{goalId}/progress", wifeId, goalId))
                .andExpect(status().isForbidden());
    }

    @Test
    void returnsBadRequestForInvalidGoalPayloadEnumAndDate() throws Exception {
        Map<String, Object> invalidTarget = goalRequest(
                "Water", "WATER_GOAL_DAYS", 20L, null, null);
        invalidTarget.put("endDate", today.minusDays(1).toString());

        mockMvc.perform(post("/api/users/{userId}/goals", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidTarget)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/users/{userId}/goals", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Goal\",\"goalType\":\"UNKNOWN\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put(
                                "/api/users/{userId}/goals/{goalId}/check-ins/{date}",
                                husbandId,
                                999L,
                                "not-a-date")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isBadRequest());
    }

    private Long createGoal(Long userId, Map<String, Object> request) throws Exception {
        String body = mockMvc.perform(post("/api/users/{userId}/goals", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode response = objectMapper.readTree(body);
        return response.get("id").asLong();
    }

    private Map<String, Object> goalRequest(
            String title,
            String goalType,
            Long targetValue,
            Integer qualifyingSleepMinutes,
            String customUnit) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("goalType", goalType);
        request.put("startDate", today.minusDays(6).toString());
        request.put("endDate", today.toString());
        request.put("targetValue", targetValue);
        request.put("qualifyingSleepMinutes", qualifyingSleepMinutes);
        request.put("customUnit", customUnit);
        request.put("notes", null);
        return request;
    }

    private UserProfile profile(String name, Gender gender) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setGender(gender);
        profile.setAge(35);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(75.0);
        profile.setCurrentWeightKg(74.0);
        profile.setTargetWeightKg(70.0);
        return profile;
    }
}
