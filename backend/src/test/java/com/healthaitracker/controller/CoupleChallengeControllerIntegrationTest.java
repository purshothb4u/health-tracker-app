package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.ChallengeCheckInRepository;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.CoupleChallengeRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
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
class CoupleChallengeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ChallengeCheckInRepository checkInRepository;
    @Autowired
    private CoupleChallengeParticipantRepository participantRepository;
    @Autowired
    private CoupleChallengeRepository challengeRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;

    private Long husbandId;
    private Long wifeId;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        checkInRepository.deleteAll();
        participantRepository.deleteAll();
        challengeRepository.deleteAll();
        userProfileRepository.deleteAll();
        husbandId = userProfileRepository.save(profile("Husband", Gender.MALE)).getId();
        wifeId = userProfileRepository.save(profile("Wife", Gender.FEMALE)).getId();
        today = LocalDate.now();
    }

    @Test
    void createsRetrievesUpdatesAndDeletesChallengeWithEmptyDeleteBody() throws Exception {
        Long challengeId = createChallenge(challengeRequest(
                "Activity challenge",
                "ACTIVITY_MINUTES",
                today.minusDays(3),
                today.plusDays(3),
                300L,
                null,
                null,
                List.of(husbandId, wifeId)));

        mockMvc.perform(get("/api/couple-challenges/{challengeId}", challengeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(challengeId))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.participants", hasSize(2)))
                .andExpect(jsonPath("$.participants[0].userProfileId").value(husbandId))
                .andExpect(jsonPath("$.participants[1].userProfileId").value(wifeId));

        Map<String, Object> update = challengeRequest(
                "  Updated challenge  ",
                "ACTIVITY_MINUTES",
                today.minusDays(4),
                today.plusDays(4),
                500L,
                null,
                null,
                List.of(wifeId, husbandId));
        update.put("notes", "  Shared progress  ");
        mockMvc.perform(put("/api/couple-challenges/{challengeId}", challengeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(challengeId))
                .andExpect(jsonPath("$.title").value("Updated challenge"))
                .andExpect(jsonPath("$.targetValue").value(500))
                .andExpect(jsonPath("$.notes").value("Shared progress"));

        mockMvc.perform(delete("/api/couple-challenges/{challengeId}", challengeId))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        mockMvc.perform(get("/api/couple-challenges/{challengeId}", challengeId))
                .andExpect(status().isNotFound());
    }

    @Test
    void filtersUsingEffectiveChallengeStatusWithoutPersistingIt() throws Exception {
        Long upcomingId = createChallenge(challengeRequest(
                "Upcoming",
                "ACTIVITY_MINUTES",
                today.plusDays(1),
                today.plusDays(7),
                100L,
                null,
                null,
                List.of(husbandId, wifeId)));
        Long activeId = createChallenge(challengeRequest(
                "Active",
                "ACTIVITY_MINUTES",
                today.minusDays(1),
                today.plusDays(1),
                100L,
                null,
                null,
                List.of(husbandId, wifeId)));

        mockMvc.perform(get("/api/couple-challenges").param("status", "UPCOMING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(upcomingId));
        mockMvc.perform(get("/api/couple-challenges").param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(activeId));
    }

    @Test
    void transitionsChallengeStatusAndReturnsFirstCompletionAchievement() throws Exception {
        Long challengeId = createChallenge(challengeRequest(
                "Complete together",
                "ACTIVITY_MINUTES",
                today.minusDays(1),
                today.plusDays(1),
                100L,
                null,
                null,
                List.of(husbandId, wifeId)));

        mockMvc.perform(put("/api/couple-challenges/{challengeId}/status", challengeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedAt").exists());

        mockMvc.perform(get("/api/users/{userId}/couple-achievements", husbandId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].achievementType")
                        .value("FIRST_COUPLE_CHALLENGE_COMPLETED"))
                .andExpect(jsonPath("$[0].challengeId").value(challengeId));
    }

    @Test
    void upsertsParticipantCheckInsAndReturnsBothProgressAndAchievement() throws Exception {
        Long challengeId = createChallenge(challengeRequest(
                "Daily together",
                "CUSTOM_CHECK_IN",
                today.minusDays(2),
                today.plusDays(2),
                1L,
                null,
                "sessions",
                List.of(husbandId, wifeId)));

        Long husbandCheckInId = upsertCheckIn(challengeId, husbandId, "First");
        upsertCheckIn(challengeId, wifeId, "Together");
        String updated = mockMvc.perform(put(
                                "/api/couple-challenges/{challengeId}/participants/{userId}/check-ins/{date}",
                                challengeId,
                                husbandId,
                                today)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true,\"notes\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(husbandCheckInId))
                .andReturn().getResponse().getContentAsString();
        JsonNode updatedCheckIn = objectMapper.readTree(updated);
        org.assertj.core.api.Assertions.assertThat(updatedCheckIn.get("createdAt").isNull()).isFalse();

        mockMvc.perform(get("/api/couple-challenges/{challengeId}/progress", challengeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.participantProgress", hasSize(2)))
                .andExpect(jsonPath("$.participantProgress[0].userProfileId").value(husbandId))
                .andExpect(jsonPath("$.participantProgress[0].currentValue").value(1))
                .andExpect(jsonPath("$.participantProgress[0].points").value(25))
                .andExpect(jsonPath("$.participantProgress[1].userProfileId").value(wifeId))
                .andExpect(jsonPath("$.participantProgress[1].currentValue").value(1))
                .andExpect(jsonPath("$.participantProgress[1].points").value(25))
                .andExpect(jsonPath("$.leaderUserProfileId").doesNotExist())
                .andExpect(jsonPath("$.tie").value(true))
                .andExpect(jsonPath("$.bothCompleted").value(true));

        mockMvc.perform(get("/api/users/{userId}/couple-achievements", wifeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].achievementType")
                        .value("BOTH_REACHED_CHALLENGE_TARGET"))
                .andExpect(jsonPath("$[0].challengeId").value(challengeId));
    }

    @Test
    void returnsNotFoundForNonparticipantCheckIn() throws Exception {
        Long challengeId = createChallenge(challengeRequest(
                "Custom",
                "CUSTOM_CHECK_IN",
                today.minusDays(1),
                today.plusDays(1),
                1L,
                null,
                null,
                List.of(husbandId, wifeId)));
        Long outsiderId = userProfileRepository.save(profile("Outsider", Gender.OTHER)).getId();

        mockMvc.perform(put(
                                "/api/couple-challenges/{challengeId}/participants/{userId}/check-ins/{date}",
                                challengeId,
                                outsiderId,
                                today)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Challenge participant not found"));
    }

    @Test
    void returnsBadRequestForDuplicateParticipantsInvalidEnumAndMalformedDate() throws Exception {
        Map<String, Object> duplicate = challengeRequest(
                "Duplicate",
                "ACTIVITY_MINUTES",
                today,
                today.plusDays(1),
                100L,
                null,
                null,
                List.of(husbandId, husbandId));
        mockMvc.perform(post("/api/couple-challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/couple-challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Challenge\",\"challengeType\":\"UNKNOWN\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put(
                                "/api/couple-challenges/{challengeId}/participants/{userId}/check-ins/{date}",
                                999L,
                                husbandId,
                                "invalid-date")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isBadRequest());
    }

    private Long createChallenge(Map<String, Object> request) throws Exception {
        String body = mockMvc.perform(post("/api/couple-challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private Long upsertCheckIn(Long challengeId, Long userId, String notes) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("completed", true);
        request.put("notes", notes);
        String body = mockMvc.perform(put(
                                "/api/couple-challenges/{challengeId}/participants/{userId}/check-ins/{date}",
                                challengeId,
                                userId,
                                today)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private Map<String, Object> challengeRequest(
            String title,
            String challengeType,
            LocalDate startDate,
            LocalDate endDate,
            Long targetValue,
            Integer qualifyingSleepMinutes,
            String customUnit,
            List<Long> participantIds) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("challengeType", challengeType);
        request.put("startDate", startDate.toString());
        request.put("endDate", endDate.toString());
        request.put("targetValue", targetValue);
        request.put("qualifyingSleepMinutes", qualifyingSleepMinutes);
        request.put("customUnit", customUnit);
        request.put("participantUserProfileIds", participantIds);
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
