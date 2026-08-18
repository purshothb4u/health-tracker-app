package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FoodEntryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    private Long userProfileId;
    private Long otherUserProfileId;

    @BeforeEach
    void setUp() {
        foodEntryRepository.deleteAll();
        healthMetricRepository.deleteAll();
        userAccountRepository.deleteAll();
        householdRepository.deleteAll();
        userProfileRepository.deleteAll();

        UserProfile primaryProfile = userProfileRepository.save(
                createProfile("Primary user", Gender.MALE, 90.0));
        userProfileId = primaryProfile.getId();
        otherUserProfileId = userProfileRepository.save(createProfile("Other user", Gender.FEMALE, 65.0)).getId();
        Household household = ControllerTestAuthentication.createHousehold(
                householdRepository,
                "Food entry test household");
        UserAccount account = ControllerTestAuthentication.createAccount(
                userAccountRepository,
                passwordEncoder,
                household,
                primaryProfile,
                "food.entry.controller@example.com");
        mockMvc = ControllerTestAuthentication.authenticatedMockMvc(applicationContext, account);
    }

    @Test
    void createsRetrievesUpdatesAndDeletesFoodEntriesForTheSelectedDate() throws Exception {
        LocalDate entryDate = LocalDate.now().minusDays(1);
        Long breakfastId = createFoodEntry(userProfileId, entryDate, "BREAKFAST", "Oats", 350, 20, 40, 10);
        Long lunchId = createFoodEntry(userProfileId, entryDate, "LUNCH", "Chicken bowl", 600, 45, 70, 18);

        mockMvc.perform(get("/api/users/{userId}/food-entries", userProfileId).param("date", entryDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(breakfastId))
                .andExpect(jsonPath("$[0].mealType").value("BREAKFAST"))
                .andExpect(jsonPath("$[1].id").value(lunchId))
                .andExpect(jsonPath("$[1].mealType").value("LUNCH"));

        mockMvc.perform(get("/api/users/{userId}/food-entries/{foodEntryId}", userProfileId, breakfastId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foodName").value("Oats"))
                .andExpect(jsonPath("$.proteinGrams").value(20));

        mockMvc.perform(put("/api/users/{userId}/food-entries/{foodEntryId}", userProfileId, breakfastId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foodEntryRequest(entryDate, "BREAKFAST", "Updated oats", 400, 25, 45, 12)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foodName").value("Updated oats"))
                .andExpect(jsonPath("$.calories").value(400));

        mockMvc.perform(delete("/api/users/{userId}/food-entries/{foodEntryId}", userProfileId, breakfastId))
                .andExpect(status().isNoContent())
                .andExpect(jsonPath("$").doesNotExist());

        mockMvc.perform(get("/api/users/{userId}/food-entries", userProfileId).param("date", entryDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(lunchId));
    }

    @Test
    void returnsDynamicNutritionSummaryTotals() throws Exception {
        LocalDate entryDate = LocalDate.now();
        saveHealthMetric(userProfileId, "80.00");
        createFoodEntry(userProfileId, entryDate, "BREAKFAST", "Oats", 350, 20, 40, 10);
        createFoodEntry(userProfileId, entryDate, "SNACK", "Yogurt", 200, 5, 30, 5);

        mockMvc.perform(get("/api/users/{userId}/nutrition-summary", userProfileId).param("date", entryDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCalories").value(550))
                .andExpect(jsonPath("$.totalProteinGrams").value(25))
                .andExpect(jsonPath("$.totalCarbohydrateGrams").value(70))
                .andExpect(jsonPath("$.totalFatGrams").value(15))
                .andExpect(jsonPath("$.maintenanceCalories").value(2099))
                .andExpect(jsonPath("$.remainingCalories").value(1549));
    }

    @Test
    void rejectsFutureDatesAndInvalidNutritionValues() throws Exception {
        mockMvc.perform(post("/api/users/{userId}/food-entries", userProfileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foodEntryRequest(LocalDate.now().plusDays(1), "BREAKFAST", "Oats", 350, 20, 40, 10)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.entryDate").exists());

        mockMvc.perform(post("/api/users/{userId}/food-entries", userProfileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foodEntryRequest(LocalDate.now(), "BREAKFAST", "Oats", 350, 20, 40, 10, -1, -5)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.quantity").exists())
                .andExpect(jsonPath("$.errors.calories").exists());

        mockMvc.perform(get("/api/users/{userId}/food-entries", userProfileId)
                        .param("date", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsNotFoundForMissingProfileAndMissingEntry() throws Exception {
        mockMvc.perform(get("/api/users/{userId}/food-entries", 999999L).param("date", LocalDate.now().toString()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users/{userId}/food-entries/{foodEntryId}", userProfileId, 999999L))
                .andExpect(status().isNotFound());
    }

    @Test
    void preventsCrossProfileRetrievalUpdateAndDeletion() throws Exception {
        LocalDate entryDate = LocalDate.now();
        Long foodEntryId = createFoodEntry(userProfileId, entryDate, "DINNER", "Salmon", 500, 35, 30, 25);

        mockMvc.perform(get("/api/users/{userId}/food-entries/{foodEntryId}", otherUserProfileId, foodEntryId))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/users/{userId}/food-entries/{foodEntryId}", otherUserProfileId, foodEntryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foodEntryRequest(entryDate, "DINNER", "Changed salmon", 400, 30, 25, 20)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/users/{userId}/food-entries/{foodEntryId}", otherUserProfileId, foodEntryId))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users/{userId}/food-entries/{foodEntryId}", userProfileId, foodEntryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foodName").value("Salmon"));
    }

    private Long createFoodEntry(
            Long profileId,
            LocalDate entryDate,
            String mealType,
            String foodName,
            double calories,
            double proteinGrams,
            double carbohydrateGrams,
            double fatGrams) throws Exception {
        String response = mockMvc.perform(post("/api/users/{userId}/food-entries", profileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(foodEntryRequest(
                                entryDate,
                                mealType,
                                foodName,
                                calories,
                                proteinGrams,
                                carbohydrateGrams,
                                fatGrams)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("id").longValue();
    }

    private String foodEntryRequest(
            LocalDate entryDate,
            String mealType,
            String foodName,
            double calories,
            double proteinGrams,
            double carbohydrateGrams,
            double fatGrams) throws Exception {
        return foodEntryRequest(entryDate, mealType, foodName, calories, proteinGrams, carbohydrateGrams, fatGrams, 1, calories);
    }

    private String foodEntryRequest(
            LocalDate entryDate,
            String mealType,
            String foodName,
            double calories,
            double proteinGrams,
            double carbohydrateGrams,
            double fatGrams,
            double quantity,
            double submittedCalories) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "entryDate", entryDate.toString(),
                "mealType", mealType,
                "foodName", foodName,
                "quantity", quantity,
                "unit", "serving",
                "calories", submittedCalories,
                "proteinGrams", proteinGrams,
                "carbohydrateGrams", carbohydrateGrams,
                "fatGrams", fatGrams,
                "notes", "Integration test"
        ));
    }

    private UserProfile createProfile(String name, Gender gender, double currentWeightKg) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setGender(gender);
        profile.setAge(30);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(currentWeightKg);
        profile.setCurrentWeightKg(currentWeightKg);
        profile.setTargetWeightKg(70.0);
        return profile;
    }

    private void saveHealthMetric(Long profileId, String weightKg) {
        UserProfile profile = userProfileRepository.findById(profileId).orElseThrow();
        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(profile);
        metric.setMetricDate(LocalDate.now());
        metric.setWeightKg(new BigDecimal(weightKg));
        healthMetricRepository.save(metric);
    }
}
