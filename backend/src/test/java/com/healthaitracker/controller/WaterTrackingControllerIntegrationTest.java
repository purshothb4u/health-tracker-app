package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
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
import java.util.Map;

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
class WaterTrackingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private MockMvc wifeMockMvc;

    @BeforeEach
    void setUp() {
        waterEntryRepository.deleteAll();
        waterGoalRepository.deleteAll();
        foodEntryRepository.deleteAll();
        healthMetricRepository.deleteAll();
        userAccountRepository.deleteAll();
        householdRepository.deleteAll();
        userProfileRepository.deleteAll();

        UserProfile husband = userProfileRepository.save(createProfile("Husband", Gender.MALE));
        UserProfile wife = userProfileRepository.save(createProfile("Wife", Gender.FEMALE));
        husbandId = husband.getId();
        wifeId = wife.getId();
        Household household = ControllerTestAuthentication.createHousehold(
                householdRepository,
                "Water tracking test household");
        UserAccount husbandAccount = ControllerTestAuthentication.createAccount(
                userAccountRepository,
                passwordEncoder,
                household,
                husband,
                "water.husband.controller@example.com");
        UserAccount wifeAccount = ControllerTestAuthentication.createAccount(
                userAccountRepository,
                passwordEncoder,
                household,
                wife,
                "water.wife.controller@example.com");
        mockMvc = ControllerTestAuthentication.authenticatedMockMvc(applicationContext, husbandAccount);
        wifeMockMvc = ControllerTestAuthentication.authenticatedMockMvc(applicationContext, wifeAccount);
    }

    @Test
    void createsUpdatesAndRetrievesTheCurrentWaterGoal() throws Exception {
        mockMvc.perform(put("/api/users/{userId}/water-goal", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(waterGoalRequest(2000)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.dailyGoalMl").value(2000))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(put("/api/users/{userId}/water-goal", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(waterGoalRequest(2500)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyGoalMl").value(2500));

        mockMvc.perform(get("/api/users/{userId}/water-goal", husbandId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.dailyGoalMl").value(2500));
    }

    @Test
    void returnsNullableGoalFieldsWhenTheProfileHasNoConfiguredGoal() throws Exception {
        mockMvc.perform(get("/api/users/{userId}/water-goal", husbandId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userProfileId").value(husbandId))
                .andExpect(jsonPath("$.dailyGoalMl").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.createdAt").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.updatedAt").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void createsAndRetrievesSelectedDateEntriesInDeterministicOrder() throws Exception {
        LocalDate entryDate = LocalDate.now();
        Long firstEntryId = createWaterEntry(husbandId, entryDate, 250, "Morning glass");
        Long secondEntryId = createWaterEntry(husbandId, entryDate, 500, "Afternoon bottle");

        mockMvc.perform(get("/api/users/{userId}/water-entries", husbandId)
                        .param("date", entryDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(firstEntryId))
                .andExpect(jsonPath("$[0].amountMl").value(250))
                .andExpect(jsonPath("$[1].id").value(secondEntryId))
                .andExpect(jsonPath("$[1].amountMl").value(500));
    }

    @Test
    void retrievesUpdatesAndDeletesAnOwnedWaterEntry() throws Exception {
        LocalDate entryDate = LocalDate.now();
        Long entryId = createWaterEntry(husbandId, entryDate, 300, "Before update");

        mockMvc.perform(get("/api/users/{userId}/water-entries/{waterEntryId}", husbandId, entryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amountMl").value(300));

        mockMvc.perform(put("/api/users/{userId}/water-entries/{waterEntryId}", husbandId, entryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(waterEntryRequest(entryDate, 750, "After update")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amountMl").value(750))
                .andExpect(jsonPath("$.notes").value("After update"));

        mockMvc.perform(delete("/api/users/{userId}/water-entries/{waterEntryId}", husbandId, entryId))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        mockMvc.perform(get("/api/users/{userId}/water-entries/{waterEntryId}", husbandId, entryId))
                .andExpect(status().isNotFound());
    }

    @Test
    void calculatesBelowExactAndAboveGoalHydrationSummaries() throws Exception {
        LocalDate belowDate = LocalDate.now().minusDays(2);
        LocalDate exactDate = LocalDate.now().minusDays(1);
        LocalDate aboveDate = LocalDate.now();
        setWaterGoal(husbandId, 2000);
        createWaterEntry(husbandId, belowDate, 1500, "Below goal");
        createWaterEntry(husbandId, exactDate, 2000, "At goal");
        createWaterEntry(husbandId, aboveDate, 2500, "Above goal");

        mockMvc.perform(get("/api/users/{userId}/hydration-summary", husbandId).param("date", belowDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalConsumedMl").value(1500))
                .andExpect(jsonPath("$.entryCount").value(1))
                .andExpect(jsonPath("$.remainingAgainstCurrentGoalMl").value(500))
                .andExpect(jsonPath("$.excessAgainstCurrentGoalMl").value(0))
                .andExpect(jsonPath("$.progressAgainstCurrentGoalPercentage").value(75.0))
                .andExpect(jsonPath("$.goalReached").value(false));

        mockMvc.perform(get("/api/users/{userId}/hydration-summary", husbandId).param("date", exactDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingAgainstCurrentGoalMl").value(0))
                .andExpect(jsonPath("$.excessAgainstCurrentGoalMl").value(0))
                .andExpect(jsonPath("$.progressAgainstCurrentGoalPercentage").value(100.0))
                .andExpect(jsonPath("$.goalReached").value(true));

        mockMvc.perform(get("/api/users/{userId}/hydration-summary", husbandId).param("date", aboveDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingAgainstCurrentGoalMl").value(0))
                .andExpect(jsonPath("$.excessAgainstCurrentGoalMl").value(500))
                .andExpect(jsonPath("$.progressAgainstCurrentGoalPercentage").value(125.0))
                .andExpect(jsonPath("$.goalReached").value(true));
    }

    @Test
    void returnsEmptyDayAndUnconfiguredGoalSummaries() throws Exception {
        LocalDate emptyDate = LocalDate.now().minusDays(1);
        setWaterGoal(husbandId, 1800);

        mockMvc.perform(get("/api/users/{userId}/hydration-summary", husbandId).param("date", emptyDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalConsumedMl").value(0))
                .andExpect(jsonPath("$.entryCount").value(0))
                .andExpect(jsonPath("$.remainingAgainstCurrentGoalMl").value(1800))
                .andExpect(jsonPath("$.excessAgainstCurrentGoalMl").value(0))
                .andExpect(jsonPath("$.progressAgainstCurrentGoalPercentage").value(0.0))
                .andExpect(jsonPath("$.goalReached").value(false));

        createWaterEntry(wifeId, emptyDate, 500, "No goal configured");
        wifeMockMvc.perform(get("/api/users/{userId}/hydration-summary", wifeId).param("date", emptyDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalConsumedMl").value(500))
                .andExpect(jsonPath("$.entryCount").value(1))
                .andExpect(jsonPath("$.currentDailyGoalMl").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.remainingAgainstCurrentGoalMl").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.excessAgainstCurrentGoalMl").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.progressAgainstCurrentGoalPercentage").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.goalReached").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void rejectsMissingMalformedAndFutureDateParameters() throws Exception {
        mockMvc.perform(get("/api/users/{userId}/water-entries", husbandId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Required request parameter is missing: date"));

        mockMvc.perform(get("/api/users/{userId}/hydration-summary", husbandId).param("date", "not-a-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: date"));

        mockMvc.perform(get("/api/users/{userId}/water-entries", husbandId)
                        .param("date", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsInvalidEntryAndGoalRequests() throws Exception {
        mockMvc.perform(post("/api/users/{userId}/water-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"entryDate\":\"" + LocalDate.now() + "\",\"amountMl\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.amountMl").exists());

        mockMvc.perform(post("/api/users/{userId}/water-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"entryDate\":\"" + LocalDate.now().plusDays(1) + "\",\"amountMl\":250}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.entryDate").exists());

        mockMvc.perform(post("/api/users/{userId}/water-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(waterEntryRequest(LocalDate.now(), 250, "x".repeat(501))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.notes").exists());

        mockMvc.perform(put("/api/users/{userId}/water-goal", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dailyGoalMl\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.dailyGoalMl").exists());

        mockMvc.perform(post("/api/users/{userId}/water-entries", husbandId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"entryDate\":"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsNotFoundForMissingProfilesAndEntriesAndProtectsCrossProfileEntries() throws Exception {
        LocalDate entryDate = LocalDate.now();
        Long husbandEntryId = createWaterEntry(husbandId, entryDate, 400, "Husband water");

        mockMvc.perform(get("/api/users/{userId}/water-goal", 999999L))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users/{userId}/water-entries/{waterEntryId}", husbandId, 999999L))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/users/{userId}/water-entries/{waterEntryId}", wifeId, husbandEntryId))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/users/{userId}/water-entries/{waterEntryId}", wifeId, husbandEntryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(waterEntryRequest(entryDate, 900, "Attempted change")))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/users/{userId}/water-entries/{waterEntryId}", wifeId, husbandEntryId))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users/{userId}/water-entries/{waterEntryId}", husbandId, husbandEntryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amountMl").value(400));
    }

    @Test
    void keepsHusbandAndWifeWaterDataIsolated() throws Exception {
        LocalDate entryDate = LocalDate.now();
        createWaterEntry(husbandId, entryDate, 300, "Husband entry");
        createWaterEntry(wifeId, entryDate, 700, "Wife entry");
        setWaterGoal(husbandId, 2000);
        setWaterGoal(wifeId, 1500);

        mockMvc.perform(get("/api/users/{userId}/hydration-summary", husbandId).param("date", entryDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalConsumedMl").value(300))
                .andExpect(jsonPath("$.currentDailyGoalMl").value(2000));

        wifeMockMvc.perform(get("/api/users/{userId}/hydration-summary", wifeId).param("date", entryDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalConsumedMl").value(700))
                .andExpect(jsonPath("$.currentDailyGoalMl").value(1500));
    }

    private Long createWaterEntry(Long userId, LocalDate entryDate, int amountMl, String notes) throws Exception {
        MockMvc client = userId.equals(wifeId) ? wifeMockMvc : mockMvc;
        String response = client.perform(post("/api/users/{userId}/water-entries", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(waterEntryRequest(entryDate, amountMl, notes)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("id").longValue();
    }

    private void setWaterGoal(Long userId, int dailyGoalMl) throws Exception {
        MockMvc client = userId.equals(wifeId) ? wifeMockMvc : mockMvc;
        client.perform(put("/api/users/{userId}/water-goal", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(waterGoalRequest(dailyGoalMl)))
                .andExpect(status().isOk());
    }

    private String waterEntryRequest(LocalDate entryDate, int amountMl, String notes) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "entryDate", entryDate.toString(),
                "amountMl", amountMl,
                "notes", notes
        ));
    }

    private String waterGoalRequest(int dailyGoalMl) throws Exception {
        return objectMapper.writeValueAsString(Map.of("dailyGoalMl", dailyGoalMl));
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
