package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.SleepEntryRepository;
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

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
class SleepTrackingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SleepEntryRepository sleepEntryRepository;

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
        sleepEntryRepository.deleteAll();
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
    void createsCrossMidnightSleepAndNapWithCalculatedDurationsAndNullableFields() throws Exception {
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        LocalDateTime nightEnd = sleepDate.atTime(6, 30);

        mockMvc.perform(post("/api/users/{userId}/sleep-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sleepRequest(
                                sleepDate,
                                "NIGHT_SLEEP",
                                nightEnd.minusHours(8),
                                nightEnd,
                                5,
                                "  Restful night  ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.sleepDate").value(sleepDate.toString()))
                .andExpect(jsonPath("$.sleepType").value("NIGHT_SLEEP"))
                .andExpect(jsonPath("$.startDateTime").value(
                        nightEnd.minusHours(8).format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))))
                .andExpect(jsonPath("$.endDateTime").value(
                        nightEnd.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))))
                .andExpect(jsonPath("$.durationMinutes").value(480))
                .andExpect(jsonPath("$.qualityRating").value(5))
                .andExpect(jsonPath("$.notes").value("Restful night"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        LocalDateTime napEnd = sleepDate.atTime(13, 45);
        mockMvc.perform(post("/api/users/{userId}/sleep-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sleepRequest(
                                sleepDate,
                                "NAP",
                                napEnd.minusMinutes(45),
                                napEnd,
                                null,
                                null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sleepType").value("NAP"))
                .andExpect(jsonPath("$.durationMinutes").value(45))
                .andExpect(jsonPath("$.qualityRating").value(nullValue()))
                .andExpect(jsonPath("$.notes").value(nullValue()));
    }

    @Test
    void retrievesSelectedDateHistoryInDeterministicOrderAndRetrievesOwnedEntry() throws Exception {
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        Long firstId = createSleep(husbandId, sleepDate, "NAP", sleepDate.atTime(10, 0), 30, null);
        Long secondId = createSleep(husbandId, sleepDate, "OTHER", sleepDate.atTime(10, 0), 20, null);
        Long thirdId = createSleep(husbandId, sleepDate, "NAP", sleepDate.atTime(9, 0), 15, null);
        LocalDateTime sharedCreatedAt = sleepDate.atTime(16, 0);
        setCreatedAt(firstId, sharedCreatedAt);
        setCreatedAt(secondId, sharedCreatedAt);

        mockMvc.perform(get("/api/users/{userId}/sleep-entries", husbandId)
                        .param("date", sleepDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(thirdId))
                .andExpect(jsonPath("$[1].id").value(firstId))
                .andExpect(jsonPath("$[2].id").value(secondId));

        mockMvc.perform(get("/api/users/{userId}/sleep-entries/{sleepEntryId}", husbandId, secondId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(secondId))
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.sleepType").value("OTHER"));

        mockMvc.perform(get("/api/users/{userId}/sleep-entries", husbandId)
                        .param("date", sleepDate.minusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void updatesAndDeletesOwnedSleepEntry() throws Exception {
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        Long sleepEntryId = createSleep(
                husbandId, sleepDate, "NIGHT_SLEEP", sleepDate.atTime(6, 30), 480, 3);
        LocalDateTime updatedEnd = sleepDate.atTime(14, 0);

        mockMvc.perform(put("/api/users/{userId}/sleep-entries/{sleepEntryId}", husbandId, sleepEntryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sleepRequest(
                                sleepDate,
                                "NAP",
                                updatedEnd.minusMinutes(60),
                                updatedEnd,
                                4,
                                "Updated")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sleepEntryId))
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.sleepType").value("NAP"))
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.qualityRating").value(4));

        mockMvc.perform(delete("/api/users/{userId}/sleep-entries/{sleepEntryId}", husbandId, sleepEntryId))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        mockMvc.perform(get("/api/users/{userId}/sleep-entries/{sleepEntryId}", husbandId, sleepEntryId))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnsEmptyAndAggregatedDailySummaries() throws Exception {
        LocalDate emptyDate = LocalDate.now().minusDays(2);
        LocalDate aggregateDate = LocalDate.now().minusDays(1);

        mockMvc.perform(get("/api/users/{userId}/sleep-summary", husbandId)
                        .param("date", emptyDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.sleepDate").value(emptyDate.toString()))
                .andExpect(jsonPath("$.sessionCount").value(0))
                .andExpect(jsonPath("$.totalSleepMinutes").value(0))
                .andExpect(jsonPath("$.nightSleepMinutes").value(0))
                .andExpect(jsonPath("$.napMinutes").value(0))
                .andExpect(jsonPath("$.averageQuality").value(nullValue()));

        createSleep(husbandId, aggregateDate, "NIGHT_SLEEP", aggregateDate.atTime(6, 30), 480, 5);
        createSleep(husbandId, aggregateDate, "NAP", aggregateDate.atTime(13, 45), 45, 4);
        createSleep(husbandId, aggregateDate, "OTHER", aggregateDate.atTime(16, 0), 30, 4);
        createSleep(husbandId, aggregateDate, "NAP", aggregateDate.atTime(18, 0), 15, null);

        mockMvc.perform(get("/api/users/{userId}/sleep-summary", husbandId)
                        .param("date", aggregateDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionCount").value(4))
                .andExpect(jsonPath("$.totalSleepMinutes").value(570))
                .andExpect(jsonPath("$.nightSleepMinutes").value(480))
                .andExpect(jsonPath("$.napMinutes").value(60))
                .andExpect(jsonPath("$.averageQuality").value(4.33));
    }

    @Test
    void rejectsMissingEmptyMalformedAndFutureDateParameters() throws Exception {
        mockMvc.perform(get("/api/users/{userId}/sleep-entries", husbandId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Required request parameter is missing: date"));
        mockMvc.perform(get("/api/users/{userId}/sleep-summary", husbandId))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/users/{userId}/sleep-entries", husbandId).param("date", ""))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/users/{userId}/sleep-summary", husbandId).param("date", "not-a-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: date"));
        mockMvc.perform(get("/api/users/{userId}/sleep-entries", husbandId)
                        .param("date", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/users/{userId}/sleep-summary", husbandId)
                        .param("date", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsInvalidSleepRequestPayloads() throws Exception {
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        LocalDateTime end = sleepDate.atTime(6, 30);
        LocalDateTime futureEnd = LocalDateTime.now().plusMinutes(10);
        List<String> invalidPayloads = List.of(
                "{}",
                sleepRequest(LocalDate.now().plusDays(1), "NIGHT_SLEEP",
                        end.minusHours(8), end, null, null),
                sleepRequest(sleepDate, null, end.minusHours(8), end, null, null),
                sleepRequest(sleepDate, "UNKNOWN", end.minusHours(8), end, null, null),
                sleepRequest(sleepDate, "NIGHT_SLEEP", null, end, null, null),
                sleepRequest(sleepDate, "NIGHT_SLEEP", end.minusHours(8), null, null, null),
                sleepRequest(sleepDate, "NIGHT_SLEEP", end.plusMinutes(1), end, null, null),
                sleepRequest(sleepDate, "NIGHT_SLEEP", end, end, null, null),
                sleepRequest(futureEnd.toLocalDate(), "NIGHT_SLEEP",
                        futureEnd.minusMinutes(30), futureEnd, null, null),
                sleepRequest(sleepDate.minusDays(1), "NIGHT_SLEEP",
                        end.minusHours(8), end, null, null),
                sleepRequest(sleepDate, "NAP", end.minusSeconds(30), end, null, null),
                sleepRequest(sleepDate, "NIGHT_SLEEP", end.minusMinutes(1_441), end, null, null),
                sleepRequest(sleepDate, "NAP", end.minusMinutes(30), end, 0, null),
                sleepRequest(sleepDate, "NAP", end.minusMinutes(30), end, 6, null),
                sleepRequest(sleepDate, "NAP", end.minusMinutes(30), end, null, "n".repeat(501)),
                "{\"sleepDate\":",
                "{\"sleepDate\":\"" + sleepDate + "\",\"sleepType\":\"NAP\","
                        + "\"startDateTime\":123,\"endDateTime\":\"" + end + "\"}",
                "{\"sleepDate\":\"" + sleepDate + "\",\"sleepType\":\"NAP\","
                        + "\"startDateTime\":\"" + end.minusMinutes(30) + "\","
                        + "\"endDateTime\":\"" + end + "\",\"qualityRating\":1.5}"
        );

        for (String invalidPayload : invalidPayloads) {
            mockMvc.perform(post("/api/users/{userId}/sleep-entries", husbandId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void returnsNotFoundForMissingProfilesAndEntries() throws Exception {
        long missingUserId = 999_999L;
        long missingEntryId = 888_888L;
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        LocalDateTime end = sleepDate.atTime(6, 30);
        String request = sleepRequest(
                sleepDate, "NIGHT_SLEEP", end.minusHours(8), end, null, null);

        mockMvc.perform(post("/api/users/{userId}/sleep-entries", missingUserId)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{userId}/sleep-entries", missingUserId)
                        .param("date", sleepDate.toString()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{userId}/sleep-entries/{sleepEntryId}",
                        missingUserId, missingEntryId))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/users/{userId}/sleep-entries/{sleepEntryId}",
                        missingUserId, missingEntryId)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/users/{userId}/sleep-entries/{sleepEntryId}",
                        missingUserId, missingEntryId))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/{userId}/sleep-summary", missingUserId)
                        .param("date", sleepDate.toString()))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/users/{userId}/sleep-entries/{sleepEntryId}", husbandId, missingEntryId))
                .andExpect(status().isNotFound());
    }

    @Test
    void protectsEntriesFromCrossProfileAccessAndKeepsProfilesIsolated() throws Exception {
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        LocalDateTime husbandEnd = sleepDate.atTime(6, 30);
        Long husbandEntryId = createSleep(
                husbandId, sleepDate, "NIGHT_SLEEP", husbandEnd, 480, 4);
        createSleep(wifeId, sleepDate, "NAP", sleepDate.atTime(14, 0), 60, 5);
        String wifeUpdate = sleepRequest(
                sleepDate,
                "NAP",
                sleepDate.atTime(15, 0),
                sleepDate.atTime(15, 30),
                3,
                null);

        mockMvc.perform(get("/api/users/{userId}/sleep-entries/{sleepEntryId}", wifeId, husbandEntryId))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/users/{userId}/sleep-entries/{sleepEntryId}", wifeId, husbandEntryId)
                        .contentType(MediaType.APPLICATION_JSON).content(wifeUpdate))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/users/{userId}/sleep-entries/{sleepEntryId}", wifeId, husbandEntryId))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/users/{userId}/sleep-entries", husbandId)
                        .param("date", sleepDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sleepType").value("NIGHT_SLEEP"));
        mockMvc.perform(get("/api/users/{userId}/sleep-entries", wifeId)
                        .param("date", sleepDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sleepType").value("NAP"));
        mockMvc.perform(get("/api/users/{userId}/sleep-summary", husbandId)
                        .param("date", sleepDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.totalSleepMinutes").value(480))
                .andExpect(jsonPath("$.nightSleepMinutes").value(480))
                .andExpect(jsonPath("$.napMinutes").value(0));
        mockMvc.perform(get("/api/users/{userId}/sleep-summary", wifeId)
                        .param("date", sleepDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(wifeId))
                .andExpect(jsonPath("$.totalSleepMinutes").value(60))
                .andExpect(jsonPath("$.nightSleepMinutes").value(0))
                .andExpect(jsonPath("$.napMinutes").value(60));

        mockMvc.perform(get("/api/users/{userId}/sleep-entries/{sleepEntryId}", husbandId, husbandEntryId))
                .andExpect(status().isOk());
    }

    private Long createSleep(
            Long userId,
            LocalDate sleepDate,
            String sleepType,
            LocalDateTime endDateTime,
            long durationMinutes,
            Integer qualityRating) throws Exception {
        String response = mockMvc.perform(post("/api/users/{userId}/sleep-entries", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sleepRequest(
                                sleepDate,
                                sleepType,
                                endDateTime.minusMinutes(durationMinutes),
                                endDateTime,
                                qualityRating,
                                null)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode responseBody = objectMapper.readTree(response);
        return responseBody.get("id").longValue();
    }

    private String sleepRequest(
            LocalDate sleepDate,
            String sleepType,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            Integer qualityRating,
            String notes) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        if (sleepDate != null) {
            request.put("sleepDate", sleepDate.toString());
        }
        if (sleepType != null) {
            request.put("sleepType", sleepType);
        }
        if (startDateTime != null) {
            request.put("startDateTime", startDateTime.toString());
        }
        if (endDateTime != null) {
            request.put("endDateTime", endDateTime.toString());
        }
        if (qualityRating != null) {
            request.put("qualityRating", qualityRating);
        }
        if (notes != null) {
            request.put("notes", notes);
        }
        return json(request);
    }

    private String json(Map<String, ?> value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private void setCreatedAt(Long sleepEntryId, LocalDateTime createdAt) {
        jdbcTemplate.update(
                "UPDATE sleep_entries SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(createdAt),
                sleepEntryId);
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
