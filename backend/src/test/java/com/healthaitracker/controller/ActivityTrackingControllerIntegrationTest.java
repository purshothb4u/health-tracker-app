package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.repository.WaterEntryRepository;
import com.healthaitracker.repository.WaterGoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

import static org.hamcrest.Matchers.nullValue;
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
class ActivityTrackingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ActivityEntryRepository activityEntryRepository;

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

    private Long husbandId;
    private Long wifeId;

    @BeforeEach
    void setUp() {
        activityEntryRepository.deleteAll();
        waterEntryRepository.deleteAll();
        waterGoalRepository.deleteAll();
        foodEntryRepository.deleteAll();
        healthMetricRepository.deleteAll();
        userProfileRepository.deleteAll();

        husbandId = userProfileRepository.save(createProfile("Husband", Gender.MALE)).getId();
        wifeId = userProfileRepository.save(createProfile("Wife", Gender.FEMALE)).getId();
    }

    @Test
    void createsActivitiesWithCompleteAndOptionalPayloadsAndNormalizesText() throws Exception {
        LocalDate activityDate = LocalDate.now();

        mockMvc.perform(post("/api/users/{userId}/activity-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(activityRequest(
                                activityDate,
                                "RUNNING",
                                "  Evening run  ",
                                45,
                                8_000,
                                new BigDecimal("6.250"),
                                420,
                                "  User-reported session  ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.activityDate").value(activityDate.toString()))
                .andExpect(jsonPath("$.category").value("RUNNING"))
                .andExpect(jsonPath("$.activityName").value("Evening run"))
                .andExpect(jsonPath("$.durationMinutes").value(45))
                .andExpect(jsonPath("$.steps").value(8_000))
                .andExpect(jsonPath("$.distanceKm").value(6.250))
                .andExpect(jsonPath("$.reportedCaloriesBurned").value(420))
                .andExpect(jsonPath("$.notes").value("User-reported session"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(post("/api/users/{userId}/activity-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(activityRequest(
                                activityDate,
                                "YOGA",
                                "Yoga",
                                30,
                                null,
                                null,
                                null,
                                "   ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.steps").value(nullValue()))
                .andExpect(jsonPath("$.distanceKm").value(nullValue()))
                .andExpect(jsonPath("$.reportedCaloriesBurned").value(nullValue()))
                .andExpect(jsonPath("$.notes").value(nullValue()));
    }

    @Test
    void retrievesSelectedDateHistoryInCreatedAtAndIdOrderAndRetrievesOneEntry() throws Exception {
        LocalDate activityDate = LocalDate.now();
        Long firstId = createActivity(husbandId, activityDate, "First");
        Long secondId = createActivity(husbandId, activityDate, "Second");
        Long thirdId = createActivity(husbandId, activityDate, "Third");
        LocalDateTime sharedTimestamp = LocalDateTime.now().minusHours(1);
        setCreatedAt(firstId, sharedTimestamp);
        setCreatedAt(secondId, sharedTimestamp);
        setCreatedAt(thirdId, sharedTimestamp.minusMinutes(1));

        mockMvc.perform(get("/api/users/{userId}/activity-entries", husbandId)
                        .param("date", activityDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(thirdId))
                .andExpect(jsonPath("$[1].id").value(firstId))
                .andExpect(jsonPath("$[2].id").value(secondId));

        mockMvc.perform(get("/api/users/{userId}/activity-entries/{activityEntryId}", husbandId, secondId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(secondId))
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.activityName").value("Second"));

        mockMvc.perform(get("/api/users/{userId}/activity-entries", husbandId)
                        .param("date", activityDate.minusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void updatesAndDeletesOwnedActivityWhilePreservingIdentityAndOwner() throws Exception {
        LocalDate activityDate = LocalDate.now();
        Long activityId = createActivity(husbandId, activityDate, "Before update");

        mockMvc.perform(put("/api/users/{userId}/activity-entries/{activityEntryId}", husbandId, activityId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(activityRequest(
                                activityDate,
                                "CYCLING",
                                "  After update  ",
                                60,
                                0,
                                new BigDecimal("20.125"),
                                500,
                                "Updated")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activityId))
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.activityName").value("After update"))
                .andExpect(jsonPath("$.category").value("CYCLING"));

        mockMvc.perform(delete("/api/users/{userId}/activity-entries/{activityEntryId}", husbandId, activityId))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        mockMvc.perform(get("/api/users/{userId}/activity-entries/{activityEntryId}", husbandId, activityId))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnsEmptyAndAggregatedDailySummariesWithApprovedNullAndZeroSemantics() throws Exception {
        LocalDate emptyDate = LocalDate.now().minusDays(2);
        LocalDate aggregateDate = LocalDate.now().minusDays(1);
        LocalDate zeroDate = LocalDate.now();

        mockMvc.perform(get("/api/users/{userId}/activity-summary", husbandId)
                        .param("date", emptyDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.activityDate").value(emptyDate.toString()))
                .andExpect(jsonPath("$.activityCount").value(0))
                .andExpect(jsonPath("$.totalDurationMinutes").value(0))
                .andExpect(jsonPath("$.reportedSteps").value(nullValue()))
                .andExpect(jsonPath("$.reportedDistanceKm").value(nullValue()))
                .andExpect(jsonPath("$.reportedCaloriesBurned").value(nullValue()));

        createActivity(husbandId, aggregateDate, "Unreported", 1440, null, null, null);
        createActivity(husbandId, aggregateDate, "Reported one", 1440, 1_000,
                new BigDecimal("1.125"), 100);
        createActivity(husbandId, aggregateDate, "Reported two", 1, 2_000,
                new BigDecimal("2.250"), 200);

        mockMvc.perform(get("/api/users/{userId}/activity-summary", husbandId)
                        .param("date", aggregateDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activityCount").value(3))
                .andExpect(jsonPath("$.totalDurationMinutes").value(2881))
                .andExpect(jsonPath("$.reportedSteps").value(3_000))
                .andExpect(jsonPath("$.reportedDistanceKm").value(3.375))
                .andExpect(jsonPath("$.reportedCaloriesBurned").value(300));

        createActivity(husbandId, zeroDate, "Explicit zero", 30, 0, new BigDecimal("0.000"), 0);
        mockMvc.perform(get("/api/users/{userId}/activity-summary", husbandId)
                        .param("date", zeroDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportedSteps").value(0))
                .andExpect(jsonPath("$.reportedDistanceKm").value(0.000))
                .andExpect(jsonPath("$.reportedCaloriesBurned").value(0));
    }

    @Test
    void rejectsMissingEmptyMalformedAndFutureDateParameters() throws Exception {
        mockMvc.perform(get("/api/users/{userId}/activity-entries", husbandId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Required request parameter is missing: date"));
        mockMvc.perform(get("/api/users/{userId}/activity-summary", husbandId))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/users/{userId}/activity-entries", husbandId).param("date", ""))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/users/{userId}/activity-summary", husbandId).param("date", "not-a-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: date"));
        mockMvc.perform(get("/api/users/{userId}/activity-entries", husbandId)
                        .param("date", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/users/{userId}/activity-summary", husbandId)
                        .param("date", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsEveryInvalidActivityRequestCategory() throws Exception {
        LocalDate today = LocalDate.now();
        List<String> invalidPayloads = List.of(
                "{}",
                json(Map.of(
                        "activityDate", today.plusDays(1).toString(),
                        "category", "WALKING",
                        "activityName", "Walk",
                        "durationMinutes", 30)),
                json(Map.of(
                        "activityDate", today.toString(),
                        "activityName", "Walk",
                        "durationMinutes", 30)),
                json(Map.of(
                        "activityDate", today.toString(),
                        "category", "SWIMMING",
                        "activityName", "Swim",
                        "durationMinutes", 30)),
                json(Map.of(
                        "activityDate", "31-07-2026",
                        "category", "WALKING",
                        "activityName", "Walk",
                        "durationMinutes", 30)),
                json(Map.of(
                        "activityDate", today.toString(),
                        "category", "WALKING",
                        "durationMinutes", 30)),
                activityRequest(today, "WALKING", "   ", 30, null, null, null, null),
                activityRequest(today, "WALKING", "a".repeat(101), 30, null, null, null, null),
                json(Map.of(
                        "activityDate", today.toString(),
                        "category", "WALKING",
                        "activityName", "Walk")),
                activityRequest(today, "WALKING", "Walk", 0, null, null, null, null),
                activityRequest(today, "WALKING", "Walk", 1441, null, null, null, null),
                "{\"activityDate\":\"" + today
                        + "\",\"category\":\"WALKING\",\"activityName\":\"Walk\","
                        + "\"durationMinutes\":1.5}",
                activityRequest(today, "WALKING", "Walk", 30, -1, null, null, null),
                activityRequest(today, "WALKING", "Walk", 30, 1_000_001, null, null, null),
                "{\"activityDate\":\"" + today
                        + "\",\"category\":\"WALKING\",\"activityName\":\"Walk\","
                        + "\"durationMinutes\":30,\"steps\":1.5}",
                activityRequest(today, "WALKING", "Walk", 30, null, new BigDecimal("-0.001"), null, null),
                activityRequest(today, "WALKING", "Walk", 30, null, new BigDecimal("10000.001"), null, null),
                activityRequest(today, "WALKING", "Walk", 30, null, new BigDecimal("1.2345"), null, null),
                activityRequest(today, "WALKING", "Walk", 30, null, null, -1, null),
                activityRequest(today, "WALKING", "Walk", 30, null, null, 100_001, null),
                "{\"activityDate\":\"" + today
                        + "\",\"category\":\"WALKING\",\"activityName\":\"Walk\","
                        + "\"durationMinutes\":30,\"reportedCaloriesBurned\":1.5}",
                activityRequest(today, "WALKING", "Walk", 30, null, null, null, "n".repeat(501)),
                "{\"activityDate\":",
                "{\"activityDate\":\"" + today
                        + "\",\"category\":\"WALKING\",\"activityName\":\"Walk\","
                        + "\"durationMinutes\":\"thirty\"}",
                "{\"activityDate\":\"" + today
                        + "\",\"category\":\"WALKING\",\"activityName\":\"Walk\","
                        + "\"durationMinutes\":30,\"distanceKm\":\"abc\"}"
        );

        for (String invalidPayload : invalidPayloads) {
            mockMvc.perform(post("/api/users/{userId}/activity-entries", husbandId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void returnsNotFoundForMissingProfileAcrossEveryEndpoint() throws Exception {
        long missingUserId = 999_999L;
        long missingEntryId = 888_888L;
        LocalDate activityDate = LocalDate.now();
        String request = activityRequest(
                activityDate, "WALKING", "Walk", 30, null, null, null, null);

        mockMvc.perform(post("/api/users/{userId}/activity-entries", missingUserId)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{userId}/activity-entries", missingUserId)
                        .param("date", activityDate.toString()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{userId}/activity-entries/{activityEntryId}",
                        missingUserId, missingEntryId))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/users/{userId}/activity-entries/{activityEntryId}",
                        missingUserId, missingEntryId)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/users/{userId}/activity-entries/{activityEntryId}",
                        missingUserId, missingEntryId))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{userId}/activity-summary", missingUserId)
                        .param("date", activityDate.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    void protectsOwnedEntryFromCrossProfileRetrieveUpdateAndDelete() throws Exception {
        LocalDate activityDate = LocalDate.now();
        Long husbandEntryId = createActivity(husbandId, activityDate, "Husband activity");
        String wifeUpdate = activityRequest(
                activityDate, "YOGA", "Attempted update", 60, null, null, null, null);

        mockMvc.perform(get("/api/users/{userId}/activity-entries/{activityEntryId}", wifeId, husbandEntryId))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/users/{userId}/activity-entries/{activityEntryId}", wifeId, husbandEntryId)
                        .contentType(MediaType.APPLICATION_JSON).content(wifeUpdate))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/users/{userId}/activity-entries/{activityEntryId}", wifeId, husbandEntryId))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/users/{userId}/activity-entries/{activityEntryId}", husbandId, husbandEntryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activityName").value("Husband activity"));
    }

    @Test
    void keepsHusbandAndWifeHistoriesAndSummariesIsolated() throws Exception {
        LocalDate activityDate = LocalDate.now();
        createActivity(husbandId, activityDate, "Husband walk", 30, 3_000, null, null);
        createActivity(wifeId, activityDate, "Wife yoga", 45, null, new BigDecimal("1.500"), 150);

        mockMvc.perform(get("/api/users/{userId}/activity-entries", husbandId)
                        .param("date", activityDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].activityName").value("Husband walk"));
        mockMvc.perform(get("/api/users/{userId}/activity-entries", wifeId)
                        .param("date", activityDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].activityName").value("Wife yoga"));
        mockMvc.perform(get("/api/users/{userId}/activity-summary", husbandId)
                        .param("date", activityDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.totalDurationMinutes").value(30))
                .andExpect(jsonPath("$.reportedSteps").value(3_000))
                .andExpect(jsonPath("$.reportedDistanceKm").value(nullValue()));
        mockMvc.perform(get("/api/users/{userId}/activity-summary", wifeId)
                        .param("date", activityDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(wifeId))
                .andExpect(jsonPath("$.totalDurationMinutes").value(45))
                .andExpect(jsonPath("$.reportedSteps").value(nullValue()))
                .andExpect(jsonPath("$.reportedDistanceKm").value(1.500));
    }

    private Long createActivity(Long userId, LocalDate activityDate, String activityName) throws Exception {
        return createActivity(userId, activityDate, activityName, 30, null, null, null);
    }

    private Long createActivity(
            Long userId,
            LocalDate activityDate,
            String activityName,
            Integer durationMinutes,
            Integer steps,
            BigDecimal distanceKm,
            Integer reportedCaloriesBurned) throws Exception {
        String response = mockMvc.perform(post("/api/users/{userId}/activity-entries", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(activityRequest(
                                activityDate,
                                "WALKING",
                                activityName,
                                durationMinutes,
                                steps,
                                distanceKm,
                                reportedCaloriesBurned,
                                null)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode responseBody = objectMapper.readTree(response);
        return responseBody.get("id").longValue();
    }

    private String activityRequest(
            LocalDate activityDate,
            String category,
            String activityName,
            Integer durationMinutes,
            Integer steps,
            BigDecimal distanceKm,
            Integer reportedCaloriesBurned,
            String notes) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        if (activityDate != null) {
            request.put("activityDate", activityDate.toString());
        }
        if (category != null) {
            request.put("category", category);
        }
        if (activityName != null) {
            request.put("activityName", activityName);
        }
        if (durationMinutes != null) {
            request.put("durationMinutes", durationMinutes);
        }
        if (steps != null) {
            request.put("steps", steps);
        }
        if (distanceKm != null) {
            request.put("distanceKm", distanceKm);
        }
        if (reportedCaloriesBurned != null) {
            request.put("reportedCaloriesBurned", reportedCaloriesBurned);
        }
        if (notes != null) {
            request.put("notes", notes);
        }
        return json(request);
    }

    private String json(Map<String, ?> value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private void setCreatedAt(Long activityEntryId, LocalDateTime createdAt) {
        jdbcTemplate.update(
                "UPDATE activity_entries SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(createdAt),
                activityEntryId);
    }

    private UserProfile createProfile(String name, Gender gender) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setGender(gender);
        profile.setAge(30);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(80.0);
        profile.setCurrentWeightKg(80.0);
        profile.setTargetWeightKg(70.0);
        return profile;
    }
}
