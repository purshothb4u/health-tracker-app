package com.healthaitracker.controller;

import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.MealType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyticsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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
        foodEntryRepository.deleteAll();
        healthMetricRepository.deleteAll();
        userProfileRepository.deleteAll();

        husbandId = userProfileRepository.save(createProfile("Husband", Gender.MALE, 85.0)).getId();
        wifeId = userProfileRepository.save(createProfile("Wife", Gender.FEMALE, 70.0)).getId();
    }

    @Test
    void returnsProfileScopedChronologicalAnalyticsForValidRange() throws Exception {
        LocalDate fromDate = LocalDate.now().minusDays(2);
        LocalDate toDate = LocalDate.now();
        saveMetric(husbandId, fromDate, "85.00");
        saveMetric(husbandId, toDate, "84.00");
        saveMetric(wifeId, fromDate, "70.00");
        saveFoodEntry(husbandId, fromDate, "400.00");
        saveFoodEntry(wifeId, fromDate, "900.00");

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId)
                        .param("from", fromDate.toString())
                        .param("to", toDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.fromDate").value(fromDate.toString()))
                .andExpect(jsonPath("$.toDate").value(toDate.toString()))
                .andExpect(jsonPath("$.weightAnalytics.weightDataPoints[0].date").value(fromDate.toString()))
                .andExpect(jsonPath("$.weightAnalytics.weightDataPoints[1].date").value(toDate.toString()))
                .andExpect(jsonPath("$.nutritionAnalytics.dailyNutritionDataPoints.length()").value(3))
                .andExpect(jsonPath("$.nutritionAnalytics.totalCalories").value(400))
                .andExpect(jsonPath("$.nutritionAnalytics.dailyNutritionDataPoints[1].foodEntryCount").value(0));
    }

    @Test
    void rejectsMissingMalformedAndInvalidDateRanges() throws Exception {
        LocalDate today = LocalDate.now();

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId).param("to", today.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Required request parameter is missing: from"));

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId).param("from", today.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Required request parameter is missing: to"));

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId)
                        .param("from", "not-a-date")
                        .param("to", today.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: from"));

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId)
                        .param("from", today.toString())
                        .param("to", "not-a-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: to"));

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId)
                        .param("from", today.toString())
                        .param("to", today.minusDays(1).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("From date must not be after to date"));

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId)
                        .param("from", today.toString())
                        .param("to", today.plusDays(1).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("To date must not be in the future"));

        mockMvc.perform(get("/api/users/{userId}/analytics", husbandId)
                        .param("from", today.minusDays(365).toString())
                        .param("to", today.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Analytics date range must not exceed 365 days"));
    }

    @Test
    void returnsNotFoundForMissingProfile() throws Exception {
        LocalDate today = LocalDate.now();

        mockMvc.perform(get("/api/users/{userId}/analytics", 999999L)
                        .param("from", today.toString())
                        .param("to", today.toString()))
                .andExpect(status().isNotFound());
    }

    private UserProfile createProfile(String name, Gender gender, double currentWeightKg) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setGender(gender);
        profile.setAge(30);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(90.0);
        profile.setCurrentWeightKg(currentWeightKg);
        profile.setTargetWeightKg(70.0);
        return profile;
    }

    private void saveMetric(Long userProfileId, LocalDate date, String weightKg) {
        UserProfile profile = userProfileRepository.findById(userProfileId).orElseThrow();
        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(profile);
        metric.setMetricDate(date);
        metric.setWeightKg(new BigDecimal(weightKg));
        healthMetricRepository.save(metric);
    }

    private void saveFoodEntry(Long userProfileId, LocalDate date, String calories) {
        UserProfile profile = userProfileRepository.findById(userProfileId).orElseThrow();
        FoodEntry entry = new FoodEntry();
        entry.setUserProfile(profile);
        entry.setEntryDate(date);
        entry.setMealType(MealType.BREAKFAST);
        entry.setFoodName("Integration test meal");
        entry.setQuantity(new BigDecimal("1.00"));
        entry.setUnit("serving");
        entry.setCalories(new BigDecimal(calories));
        entry.setProteinG(BigDecimal.ZERO);
        entry.setCarbohydratesG(BigDecimal.ZERO);
        entry.setFatG(BigDecimal.ZERO);
        foodEntryRepository.save(entry);
    }
}
