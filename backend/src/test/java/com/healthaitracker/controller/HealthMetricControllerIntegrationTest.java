package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HealthMetricControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HealthMetricRepository healthMetricRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private Long userProfileId;

    @BeforeEach
    void setUp() {
        healthMetricRepository.deleteAll();
        userProfileRepository.deleteAll();

        UserProfile profile = new UserProfile();
        profile.setName("Integration user");
        profile.setGender(Gender.MALE);
        profile.setAge(30);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(87.0);
        profile.setCurrentWeightKg(87.0);
        profile.setTargetWeightKg(75.0);
        userProfileId = userProfileRepository.save(profile).getId();
    }

    @Test
    void createsAndUpdatesMetric() throws Exception {
        LocalDate metricDate = LocalDate.now().minusDays(1);
        Long metricId = createMetric(metricDate, 85.0, "Initial record");

        mockMvc.perform(put("/api/users/{id}/metrics/{metricId}", userProfileId, metricId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(metricRequest(metricDate, 84.5, "Updated record")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(metricId))
                .andExpect(jsonPath("$.weightKg").value(84.5))
                .andExpect(jsonPath("$.notes").value("Updated record"));
    }

    @Test
    void returnsConflictForDuplicateDailyMetric() throws Exception {
        LocalDate metricDate = LocalDate.now();
        createMetric(metricDate, 85.0, null);

        mockMvc.perform(post("/api/users/{id}/metrics", userProfileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(metricRequest(metricDate, 84.5, null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "A health metric already exists for this user on " + metricDate));
    }

    @Test
    void returnsHistoryLatestMetricAndSummary() throws Exception {
        createMetric(LocalDate.now().minusDays(1), 86.0, "Yesterday");
        createMetric(LocalDate.now(), 85.0, "Today");

        mockMvc.perform(get("/api/users/{id}/metrics", userProfileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].metricDate").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$[0].weightKg").value(85.0));

        mockMvc.perform(get("/api/users/{id}/metrics/latest", userProfileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metricDate").value(LocalDate.now().toString()));

        mockMvc.perform(get("/api/users/{id}/summary", userProfileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latestWeightKg").value(85.0))
                .andExpect(jsonPath("$.bmi").value(27.76))
                .andExpect(jsonPath("$.bmrCaloriesPerDay").value(1799))
                .andExpect(jsonPath("$.maintenanceCaloriesPerDay").value(2159));
    }

    @Test
    void rejectsFutureDatesInvalidWeightAndLongNotes() throws Exception {
        mockMvc.perform(post("/api/users/{id}/metrics", userProfileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(metricRequest(LocalDate.now().plusDays(1), 85.0, null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.metricDate").exists());

        mockMvc.perform(post("/api/users/{id}/metrics", userProfileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(metricRequest(LocalDate.now(), 0.0, null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.weightKg").exists());

        mockMvc.perform(post("/api/users/{id}/metrics", userProfileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(metricRequest(LocalDate.now(), 85.0, "x".repeat(501))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.notes").exists());
    }

    private Long createMetric(LocalDate metricDate, double weightKg, String notes) throws Exception {
        String response = mockMvc.perform(post("/api/users/{id}/metrics", userProfileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(metricRequest(metricDate, weightKg, notes)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("id").longValue();
    }

    private String metricRequest(LocalDate metricDate, double weightKg, String notes) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "metricDate", metricDate.toString(),
                "weightKg", weightKg,
                "notes", notes == null ? "" : notes
        ));
    }
}
