package com.healthaitracker.config;

import com.healthaitracker.entity.ActivityCategory;
import com.healthaitracker.entity.ActivityEntry;
import com.healthaitracker.entity.ChallengeCheckIn;
import com.healthaitracker.entity.ChallengeStatus;
import com.healthaitracker.entity.ChallengeType;
import com.healthaitracker.entity.CoupleChallenge;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalCheckIn;
import com.healthaitracker.entity.GoalStatus;
import com.healthaitracker.entity.GoalType;
import com.healthaitracker.entity.MealType;
import com.healthaitracker.entity.SleepEntry;
import com.healthaitracker.entity.SleepType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.WaterEntry;
import com.healthaitracker.entity.WaterGoal;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.ChallengeCheckInRepository;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.CoupleChallengeRepository;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.GoalCheckInRepository;
import com.healthaitracker.repository.GoalRepository;
import com.healthaitracker.repository.SleepEntryRepository;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.WaterEntryRepository;
import com.healthaitracker.repository.WaterGoalRepository;
import com.healthaitracker.service.UserAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String FOOD_SEED_NOTE_PREFIX = "Development seed data: ";
    private static final String WATER_SEED_NOTE_PREFIX = "Development water seed data: ";
    private static final String ACTIVITY_SEED_NOTE_PREFIX = "Development activity seed data:";
    private static final String SLEEP_SEED_NOTE_PREFIX = "Development sleep seed data:";
    private static final String GOAL_SEED_NOTE_PREFIX = "Development goal seed data:";
    private static final String CHALLENGE_SEED_NOTE_PREFIX =
            "Development couple challenge seed data:";
    private static final String DEVELOPMENT_HOUSEHOLD_NAME =
            "HealthAITracker Development Household";
    private static final String HUSBAND_ACCOUNT_EMAIL = "purush@healthaitracker.test";
    private static final String WIFE_ACCOUNT_EMAIL = "kasturi@healthaitracker.test";

    @Bean
    CommandLineRunner seedUserProfiles(
            UserProfileRepository userProfileRepository,
            HealthMetricRepository healthMetricRepository,
            FoodEntryRepository foodEntryRepository,
            WaterGoalRepository waterGoalRepository,
            WaterEntryRepository waterEntryRepository,
            ActivityEntryRepository activityEntryRepository,
            SleepEntryRepository sleepEntryRepository,
            GoalRepository goalRepository,
            GoalCheckInRepository goalCheckInRepository,
            CoupleChallengeRepository challengeRepository,
            CoupleChallengeParticipantRepository participantRepository,
            ChallengeCheckInRepository challengeCheckInRepository,
            HouseholdRepository householdRepository,
            UserAccountRepository userAccountRepository,
            UserAccountService userAccountService,
            TransactionTemplate transactionTemplate,
            @Value("${app.seed-data.enabled:false}") boolean seedEnabled,
            @Value("${app.seed-data.account-password:}") String seedAccountPassword) {
        return args -> {
            if (!seedEnabled) {
                return;
            }

            transactionTemplate.executeWithoutResult(status -> seedDevelopmentData(
                    userProfileRepository,
                    healthMetricRepository,
                    foodEntryRepository,
                    waterGoalRepository,
                    waterEntryRepository,
                    activityEntryRepository,
                    sleepEntryRepository,
                    goalRepository,
                    goalCheckInRepository,
                    challengeRepository,
                    participantRepository,
                    challengeCheckInRepository,
                    householdRepository,
                    userAccountRepository,
                    userAccountService,
                    seedAccountPassword));
        };
    }

    private void seedDevelopmentData(
            UserProfileRepository userProfileRepository,
            HealthMetricRepository healthMetricRepository,
            FoodEntryRepository foodEntryRepository,
            WaterGoalRepository waterGoalRepository,
            WaterEntryRepository waterEntryRepository,
            ActivityEntryRepository activityEntryRepository,
            SleepEntryRepository sleepEntryRepository,
            GoalRepository goalRepository,
            GoalCheckInRepository goalCheckInRepository,
            CoupleChallengeRepository challengeRepository,
            CoupleChallengeParticipantRepository participantRepository,
            ChallengeCheckInRepository challengeCheckInRepository,
            HouseholdRepository householdRepository,
            UserAccountRepository userAccountRepository,
            UserAccountService userAccountService,
            String seedAccountPassword) {
        List<UserProfile> profiles = userProfileRepository.count() == 0
                ? seedUserProfiles(userProfileRepository)
                : userProfileRepository.findAll();

        seedAuthenticationFoundation(
                profiles,
                userProfileRepository,
                householdRepository,
                userAccountRepository,
                userAccountService,
                seedAccountPassword);

        profiles.stream()
                .filter(profile -> "Husband".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedHistoricalMetrics(
                        profile,
                        List.of(new BigDecimal("87.00"), new BigDecimal("86.00"), new BigDecimal("85.00")),
                        healthMetricRepository,
                        userProfileRepository));

        profiles.stream()
                .filter(profile -> "Wife".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedHistoricalMetrics(
                        profile,
                        List.of(new BigDecimal("71.00"), new BigDecimal("70.50"), new BigDecimal("70.00")),
                        healthMetricRepository,
                        userProfileRepository));

        if (foodEntryRepository.existsByNotesStartingWith(FOOD_SEED_NOTE_PREFIX)) {
            log.info("Development food seed data already exists; preserving the original seeded dates.");
        } else {
            profiles.stream()
                    .filter(profile -> "Husband".equals(profile.getName()))
                    .findFirst()
                    .ifPresent(profile -> seedFoodEntries(profile, husbandFoodSeedEntries(), foodEntryRepository));

            profiles.stream()
                    .filter(profile -> "Wife".equals(profile.getName()))
                    .findFirst()
                    .ifPresent(profile -> seedFoodEntries(profile, wifeFoodSeedEntries(), foodEntryRepository));
        }

        seedWaterGoals(profiles, waterGoalRepository);
        seedWaterEntries(profiles, waterEntryRepository);
        seedActivityEntries(profiles, activityEntryRepository);
        seedSleepEntries(profiles, sleepEntryRepository);
        seedGoals(profiles, goalRepository, goalCheckInRepository);
        seedCoupleChallenges(
                profiles,
                challengeRepository,
                participantRepository,
                challengeCheckInRepository);
    }

    private void seedAuthenticationFoundation(
            List<UserProfile> profiles,
            UserProfileRepository userProfileRepository,
            HouseholdRepository householdRepository,
            UserAccountRepository userAccountRepository,
            UserAccountService userAccountService,
            String seedAccountPassword) {
        UserProfile husband = findUniqueProfile(profiles, "Husband");
        UserProfile wife = findUniqueProfile(profiles, "Wife");
        if (husband == null || wife == null || husband.getId().equals(wife.getId())) {
            log.warn("Skipping development account seed data because unique Husband and Wife profiles are unavailable.");
            return;
        }

        seedDisplayNameIfBlank(husband, "Purush", userProfileRepository);
        seedDisplayNameIfBlank(wife, "Kasturi", userProfileRepository);

        Optional<UserAccount> husbandAccount = userAccountRepository.findByEmail(HUSBAND_ACCOUNT_EMAIL);
        Optional<UserAccount> wifeAccount = userAccountRepository.findByEmail(WIFE_ACCOUNT_EMAIL);
        husbandAccount.ifPresent(account -> validateSeedAccount(account, husband));
        wifeAccount.ifPresent(account -> validateSeedAccount(account, wife));

        Household household = husbandAccount.map(UserAccount::getHousehold)
                .or(() -> wifeAccount.map(UserAccount::getHousehold))
                .orElse(null);
        if (husbandAccount.isPresent()
                && wifeAccount.isPresent()
                && !husbandAccount.get().getHousehold().getId()
                .equals(wifeAccount.get().getHousehold().getId())) {
            throw new IllegalStateException(
                    "Development seed accounts must belong to the same household");
        }

        boolean accountCreationRequired = husbandAccount.isEmpty() || wifeAccount.isEmpty();
        if (accountCreationRequired && (seedAccountPassword == null || seedAccountPassword.isBlank())) {
            log.warn("Development account seeding is enabled, but no account password is configured; "
                    + "no default credential will be created.");
            return;
        }

        if (household == null) {
            household = new Household();
            household.setDisplayName(DEVELOPMENT_HOUSEHOLD_NAME);
            household = householdRepository.save(household);
        }

        if (husbandAccount.isEmpty()) {
            userAccountService.createAccount(
                    HUSBAND_ACCOUNT_EMAIL,
                    seedAccountPassword,
                    household.getId(),
                    husband.getId());
        }
        if (wifeAccount.isEmpty()) {
            userAccountService.createAccount(
                    WIFE_ACCOUNT_EMAIL,
                    seedAccountPassword,
                    household.getId(),
                    wife.getId());
        }

        if (accountCreationRequired) {
            log.info("Seeded development household account ownership relationships.");
        }
    }

    private UserProfile findUniqueProfile(List<UserProfile> profiles, String name) {
        List<UserProfile> matches = profiles.stream()
                .filter(profile -> name.equals(profile.getName()))
                .toList();
        return matches.size() == 1 ? matches.get(0) : null;
    }

    private void seedDisplayNameIfBlank(
            UserProfile profile,
            String displayName,
            UserProfileRepository userProfileRepository) {
        if (profile.getDisplayName() == null || profile.getDisplayName().isBlank()) {
            profile.setDisplayName(displayName);
            userProfileRepository.save(profile);
        }
    }

    private void validateSeedAccount(UserAccount account, UserProfile expectedProfile) {
        if (!account.getUserProfile().getId().equals(expectedProfile.getId())) {
            throw new IllegalStateException(
                    "A development seed account is already linked to an unexpected user profile");
        }
    }

    private void seedGoals(
            List<UserProfile> profiles,
            GoalRepository goalRepository,
            GoalCheckInRepository goalCheckInRepository) {
        if (goalRepository.existsByNotesStartingWith(GOAL_SEED_NOTE_PREFIX)) {
            log.info("Development goal seed data already exists; preserving the original seeded dates.");
            return;
        }

        UserProfile husband = findProfile(profiles, "Husband");
        UserProfile wife = findProfile(profiles, "Wife");
        LocalDate today = LocalDate.now();

        if (husband != null) {
            Goal activityGoal = createGoal(
                    husband,
                    "Build a regular activity routine",
                    GoalType.ACTIVITY_MINUTES,
                    today.minusDays(6),
                    today.plusDays(7),
                    180L,
                    null,
                    null,
                    GoalStatus.ACTIVE,
                    GOAL_SEED_NOTE_PREFIX + " Husband / active activity minutes");
            goalRepository.save(activityGoal);

            Goal completedCheckInGoal = createGoal(
                    husband,
                    "Complete three wellbeing check-ins",
                    GoalType.CUSTOM_CHECK_IN,
                    today.minusDays(6),
                    today,
                    3L,
                    null,
                    "check-ins",
                    GoalStatus.COMPLETED,
                    GOAL_SEED_NOTE_PREFIX + " Husband / completed custom check-in");
            completedCheckInGoal.setCompletedAt(LocalDateTime.now());
            completedCheckInGoal = goalRepository.save(completedCheckInGoal);
            seedGoalCheckIn(completedCheckInGoal, today.minusDays(2), "Completed check-in 1", goalCheckInRepository);
            seedGoalCheckIn(completedCheckInGoal, today.minusDays(1), "Completed check-in 2", goalCheckInRepository);
            seedGoalCheckIn(completedCheckInGoal, today, "Completed check-in 3", goalCheckInRepository);
        }

        if (wife != null) {
            Goal sleepGoal = createGoal(
                    wife,
                    "Maintain a consistent sleep routine",
                    GoalType.SLEEP_TARGET_DAYS,
                    today.minusDays(6),
                    today.plusDays(7),
                    3L,
                    420,
                    null,
                    GoalStatus.ACTIVE,
                    GOAL_SEED_NOTE_PREFIX + " Wife / active sleep target days");
            goalRepository.save(sleepGoal);
        }
    }

    private Goal createGoal(
            UserProfile profile,
            String title,
            GoalType goalType,
            LocalDate startDate,
            LocalDate endDate,
            long targetValue,
            Integer qualifyingSleepMinutes,
            String customUnit,
            GoalStatus status,
            String notes) {
        Goal goal = new Goal();
        goal.setUserProfile(profile);
        goal.setTitle(title);
        goal.setGoalType(goalType);
        goal.setStartDate(startDate);
        goal.setEndDate(endDate);
        goal.setTargetValue(targetValue);
        goal.setQualifyingSleepMinutes(qualifyingSleepMinutes);
        goal.setCustomUnit(customUnit);
        goal.setStatus(status);
        goal.setNotes(notes);
        return goal;
    }

    private void seedGoalCheckIn(
            Goal goal,
            LocalDate date,
            String notes,
            GoalCheckInRepository goalCheckInRepository) {
        GoalCheckIn checkIn = new GoalCheckIn();
        checkIn.setGoal(goal);
        checkIn.setCheckInDate(date);
        checkIn.setCompleted(true);
        checkIn.setNotes(notes);
        goalCheckInRepository.save(checkIn);
    }

    private void seedCoupleChallenges(
            List<UserProfile> profiles,
            CoupleChallengeRepository challengeRepository,
            CoupleChallengeParticipantRepository participantRepository,
            ChallengeCheckInRepository checkInRepository) {
        if (challengeRepository.existsByNotesStartingWith(CHALLENGE_SEED_NOTE_PREFIX)) {
            log.info("Development couple challenge seed data already exists; preserving the original seeded dates.");
            return;
        }

        UserProfile husband = findProfile(profiles, "Husband");
        UserProfile wife = findProfile(profiles, "Wife");
        if (husband == null || wife == null || husband.getId().equals(wife.getId())) {
            log.warn("Skipping development couple challenge seed data because Husband and Wife profiles are unavailable.");
            return;
        }

        LocalDate today = LocalDate.now();
        CoupleChallenge activeChallenge = createChallenge(
                "Complete shared daily check-ins",
                today.minusDays(3),
                today.plusDays(3),
                3L,
                ChallengeStatus.ACTIVE,
                CHALLENGE_SEED_NOTE_PREFIX + " active custom check-in");
        activeChallenge = challengeRepository.save(activeChallenge);
        List<CoupleChallengeParticipant> activeParticipants = seedParticipants(
                activeChallenge,
                husband,
                wife,
                participantRepository);
        seedChallengeCheckIn(
                activeParticipants.get(0),
                today.minusDays(2),
                "Husband active check-in 1",
                checkInRepository);
        seedChallengeCheckIn(
                activeParticipants.get(0),
                today.minusDays(1),
                "Husband active check-in 2",
                checkInRepository);
        seedChallengeCheckIn(
                activeParticipants.get(1),
                today.minusDays(2),
                "Wife active check-in 1",
                checkInRepository);

        CoupleChallenge completedChallenge = createChallenge(
                "Complete a shared two-day check-in challenge",
                today.minusDays(6),
                today.minusDays(1),
                2L,
                ChallengeStatus.COMPLETED,
                CHALLENGE_SEED_NOTE_PREFIX + " completed custom check-in");
        completedChallenge.setCompletedAt(today.minusDays(1).atTime(20, 0));
        completedChallenge = challengeRepository.save(completedChallenge);
        List<CoupleChallengeParticipant> completedParticipants = seedParticipants(
                completedChallenge,
                husband,
                wife,
                participantRepository);
        for (CoupleChallengeParticipant participant : completedParticipants) {
            seedChallengeCheckIn(
                    participant,
                    today.minusDays(3),
                    participant.getUserProfile().getName() + " completed check-in 1",
                    checkInRepository);
            seedChallengeCheckIn(
                    participant,
                    today.minusDays(2),
                    participant.getUserProfile().getName() + " completed check-in 2",
                    checkInRepository);
        }
    }

    private CoupleChallenge createChallenge(
            String title,
            LocalDate startDate,
            LocalDate endDate,
            long targetValue,
            ChallengeStatus status,
            String notes) {
        CoupleChallenge challenge = new CoupleChallenge();
        challenge.setTitle(title);
        challenge.setChallengeType(ChallengeType.CUSTOM_CHECK_IN);
        challenge.setStartDate(startDate);
        challenge.setEndDate(endDate);
        challenge.setTargetValue(targetValue);
        challenge.setCustomUnit("check-ins");
        challenge.setStatus(status);
        challenge.setNotes(notes);
        return challenge;
    }

    private List<CoupleChallengeParticipant> seedParticipants(
            CoupleChallenge challenge,
            UserProfile husband,
            UserProfile wife,
            CoupleChallengeParticipantRepository participantRepository) {
        CoupleChallengeParticipant husbandParticipant = new CoupleChallengeParticipant();
        husbandParticipant.setCoupleChallenge(challenge);
        husbandParticipant.setUserProfile(husband);
        CoupleChallengeParticipant wifeParticipant = new CoupleChallengeParticipant();
        wifeParticipant.setCoupleChallenge(challenge);
        wifeParticipant.setUserProfile(wife);
        return participantRepository.saveAll(List.of(husbandParticipant, wifeParticipant));
    }

    private void seedChallengeCheckIn(
            CoupleChallengeParticipant participant,
            LocalDate date,
            String notes,
            ChallengeCheckInRepository checkInRepository) {
        ChallengeCheckIn checkIn = new ChallengeCheckIn();
        checkIn.setParticipant(participant);
        checkIn.setCheckInDate(date);
        checkIn.setCompleted(true);
        checkIn.setNotes(notes);
        checkInRepository.save(checkIn);
    }

    private UserProfile findProfile(List<UserProfile> profiles, String name) {
        return profiles.stream()
                .filter(profile -> name.equals(profile.getName()))
                .findFirst()
                .orElse(null);
    }

    private List<UserProfile> seedUserProfiles(UserProfileRepository userProfileRepository) {
        log.info("Seeding development user profiles...");

        UserProfile husband = userProfileRepository.save(createProfile(
                "Husband", Gender.MALE, 30, 175.0, 87.0, 87.0, 75.0));
        UserProfile wife = userProfileRepository.save(createProfile(
                "Wife", Gender.FEMALE, 30, 165.0, 71.0, 71.0, 63.0));

        log.info("Seeded {} user profiles", userProfileRepository.count());
        return List.of(husband, wife);
    }

    private void seedHistoricalMetrics(
            UserProfile profile,
            List<BigDecimal> weights,
            HealthMetricRepository healthMetricRepository,
            UserProfileRepository userProfileRepository) {
        LocalDate firstMetricDate = LocalDate.now().minusDays(weights.size() - 1L);

        for (int index = 0; index < weights.size(); index++) {
            LocalDate metricDate = firstMetricDate.plusDays(index);
            if (healthMetricRepository.existsByUserProfileIdAndMetricDate(profile.getId(), metricDate)) {
                continue;
            }

            HealthMetric metric = new HealthMetric();
            metric.setUserProfile(profile);
            metric.setMetricDate(metricDate);
            metric.setWeightKg(weights.get(index));
            metric.setNotes("Development seed data");
            healthMetricRepository.save(metric);
        }

        healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(profile.getId())
                .ifPresent(latestMetric -> synchronizeCurrentWeight(profile, latestMetric, userProfileRepository));
    }

    private void synchronizeCurrentWeight(
            UserProfile profile,
            HealthMetric latestMetric,
            UserProfileRepository userProfileRepository) {
        double latestWeightKg = latestMetric.getWeightKg().doubleValue();
        if (Double.compare(profile.getCurrentWeightKg(), latestWeightKg) != 0) {
            profile.setCurrentWeightKg(latestWeightKg);
            userProfileRepository.save(profile);
        }
    }

    private void seedFoodEntries(
            UserProfile profile,
            List<FoodSeedEntry> seedEntries,
            FoodEntryRepository foodEntryRepository) {
        for (FoodSeedEntry seedEntry : seedEntries) {
            LocalDate entryDate = LocalDate.now().minusDays(seedEntry.daysAgo());
            String notes = FOOD_SEED_NOTE_PREFIX + profile.getName() + " / " + seedEntry.seedKey();

            FoodEntry foodEntry = new FoodEntry();
            foodEntry.setUserProfile(profile);
            foodEntry.setEntryDate(entryDate);
            foodEntry.setMealType(seedEntry.mealType());
            foodEntry.setFoodName(seedEntry.foodName());
            foodEntry.setQuantity(seedEntry.quantity());
            foodEntry.setUnit(seedEntry.unit());
            foodEntry.setCalories(seedEntry.calories());
            foodEntry.setProteinG(seedEntry.proteinG());
            foodEntry.setCarbohydratesG(seedEntry.carbohydratesG());
            foodEntry.setFatG(seedEntry.fatG());
            foodEntry.setNotes(notes);
            foodEntryRepository.save(foodEntry);
        }
    }

    private void seedWaterGoals(List<UserProfile> profiles, WaterGoalRepository waterGoalRepository) {
        profiles.stream()
                .filter(profile -> "Husband".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedWaterGoalIfAbsent(profile, 2500, waterGoalRepository));

        profiles.stream()
                .filter(profile -> "Wife".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedWaterGoalIfAbsent(profile, 2000, waterGoalRepository));
    }

    private void seedWaterGoalIfAbsent(
            UserProfile profile,
            int dailyGoalMl,
            WaterGoalRepository waterGoalRepository) {
        if (waterGoalRepository.existsByUserProfileId(profile.getId())) {
            return;
        }

        WaterGoal waterGoal = new WaterGoal();
        waterGoal.setUserProfile(profile);
        waterGoal.setDailyGoalMl(dailyGoalMl);
        waterGoalRepository.save(waterGoal);
    }

    private void seedWaterEntries(List<UserProfile> profiles, WaterEntryRepository waterEntryRepository) {
        if (waterEntryRepository.existsByNotesStartingWith(WATER_SEED_NOTE_PREFIX)) {
            log.info("Development water seed data already exists; preserving the original seeded dates.");
            return;
        }

        profiles.stream()
                .filter(profile -> "Husband".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedWaterEntries(profile, husbandWaterSeedEntries(), waterEntryRepository));

        profiles.stream()
                .filter(profile -> "Wife".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedWaterEntries(profile, wifeWaterSeedEntries(), waterEntryRepository));
    }

    private void seedWaterEntries(
            UserProfile profile,
            List<WaterSeedEntry> seedEntries,
            WaterEntryRepository waterEntryRepository) {
        for (WaterSeedEntry seedEntry : seedEntries) {
            WaterEntry waterEntry = new WaterEntry();
            waterEntry.setUserProfile(profile);
            waterEntry.setEntryDate(LocalDate.now().minusDays(seedEntry.daysAgo()));
            waterEntry.setAmountMl(seedEntry.amountMl());
            waterEntry.setNotes(WATER_SEED_NOTE_PREFIX + profile.getName() + " / " + seedEntry.seedKey());
            waterEntryRepository.save(waterEntry);
        }
    }

    private List<WaterSeedEntry> husbandWaterSeedEntries() {
        return List.of(
                waterSeedEntry(2, 750, "below-goal-morning"),
                waterSeedEntry(2, 500, "below-goal-afternoon"),
                waterSeedEntry(2, 750, "below-goal-evening"),
                waterSeedEntry(1, 1000, "goal-reached-morning"),
                waterSeedEntry(1, 750, "goal-reached-afternoon"),
                waterSeedEntry(1, 750, "goal-reached-evening"),
                waterSeedEntry(0, 1000, "above-goal-morning"),
                waterSeedEntry(0, 750, "above-goal-afternoon"),
                waterSeedEntry(0, 1000, "above-goal-evening")
        );
    }

    private List<WaterSeedEntry> wifeWaterSeedEntries() {
        return List.of(
                waterSeedEntry(2, 500, "below-goal-morning"),
                waterSeedEntry(2, 500, "below-goal-afternoon"),
                waterSeedEntry(2, 750, "below-goal-evening"),
                waterSeedEntry(1, 750, "goal-reached-morning"),
                waterSeedEntry(1, 750, "goal-reached-afternoon"),
                waterSeedEntry(1, 500, "goal-reached-evening"),
                waterSeedEntry(0, 1000, "above-goal-morning"),
                waterSeedEntry(0, 750, "above-goal-afternoon"),
                waterSeedEntry(0, 500, "above-goal-evening")
        );
    }

    private void seedActivityEntries(
            List<UserProfile> profiles,
            ActivityEntryRepository activityEntryRepository) {
        if (activityEntryRepository.existsByNotesStartingWith(ACTIVITY_SEED_NOTE_PREFIX)) {
            log.info("Development activity seed data already exists; preserving the original seeded dates.");
            return;
        }

        profiles.stream()
                .filter(profile -> "Husband".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedActivityEntries(
                        profile,
                        husbandActivitySeedEntries(),
                        activityEntryRepository));

        profiles.stream()
                .filter(profile -> "Wife".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedActivityEntries(
                        profile,
                        wifeActivitySeedEntries(),
                        activityEntryRepository));
    }

    private void seedActivityEntries(
            UserProfile profile,
            List<ActivitySeedEntry> seedEntries,
            ActivityEntryRepository activityEntryRepository) {
        for (ActivitySeedEntry seedEntry : seedEntries) {
            ActivityEntry activityEntry = new ActivityEntry();
            activityEntry.setUserProfile(profile);
            activityEntry.setActivityDate(LocalDate.now().minusDays(seedEntry.daysAgo()));
            activityEntry.setCategory(seedEntry.category());
            activityEntry.setActivityName(seedEntry.activityName());
            activityEntry.setDurationMinutes(seedEntry.durationMinutes());
            activityEntry.setSteps(seedEntry.steps());
            activityEntry.setDistanceKm(seedEntry.distanceKm());
            activityEntry.setReportedCaloriesBurned(seedEntry.reportedCaloriesBurned());
            activityEntry.setNotes(ACTIVITY_SEED_NOTE_PREFIX
                    + " " + profile.getName() + " / " + seedEntry.seedKey());
            activityEntryRepository.save(activityEntry);
        }
    }

    private List<ActivitySeedEntry> husbandActivitySeedEntries() {
        return List.of(
                activitySeedEntry(2, ActivityCategory.WALKING, "Neighbourhood walk", 40,
                        4_500, "3.250", null, "walking-with-steps-distance"),
                activitySeedEntry(1, ActivityCategory.STRENGTH_TRAINING, "Strength training", 45,
                        null, null, 320, "strength-with-reported-calories"),
                activitySeedEntry(0, ActivityCategory.WALKING, "Short walk", 30,
                        0, "0.000", null, "walking-with-explicit-zero"),
                activitySeedEntry(0, ActivityCategory.OTHER, "Mobility session", 20,
                        null, null, null, "activity-with-measurements-unavailable")
        );
    }

    private List<ActivitySeedEntry> wifeActivitySeedEntries() {
        return List.of(
                activitySeedEntry(2, ActivityCategory.YOGA, "Yoga session", 35,
                        null, null, null, "yoga-with-measurements-unavailable"),
                activitySeedEntry(1, ActivityCategory.CYCLING, "Leisure cycling", 40,
                        null, "12.500", 280, "cycling-with-distance-calories"),
                activitySeedEntry(0, ActivityCategory.WALKING, "Park walk", 30,
                        3_800, "2.750", null, "walking-with-steps-distance"),
                activitySeedEntry(0, ActivityCategory.YOGA, "Evening yoga", 20,
                        null, null, 0, "yoga-with-explicit-zero-calories")
        );
    }

    private ActivitySeedEntry activitySeedEntry(
            int daysAgo,
            ActivityCategory category,
            String activityName,
            int durationMinutes,
            Integer steps,
            String distanceKm,
            Integer reportedCaloriesBurned,
            String seedKey) {
        return new ActivitySeedEntry(
                daysAgo,
                category,
                activityName,
                durationMinutes,
                steps,
                distanceKm == null ? null : new BigDecimal(distanceKm),
                reportedCaloriesBurned,
                seedKey
        );
    }

    private void seedSleepEntries(
            List<UserProfile> profiles,
            SleepEntryRepository sleepEntryRepository) {
        if (sleepEntryRepository.existsByNotesStartingWith(SLEEP_SEED_NOTE_PREFIX)) {
            log.info("Development sleep seed data already exists; preserving the original seeded dates.");
            return;
        }

        profiles.stream()
                .filter(profile -> "Husband".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedSleepEntries(
                        profile,
                        husbandSleepSeedEntries(),
                        sleepEntryRepository));

        profiles.stream()
                .filter(profile -> "Wife".equals(profile.getName()))
                .findFirst()
                .ifPresent(profile -> seedSleepEntries(
                        profile,
                        wifeSleepSeedEntries(),
                        sleepEntryRepository));
    }

    private void seedSleepEntries(
            UserProfile profile,
            List<SleepSeedEntry> seedEntries,
            SleepEntryRepository sleepEntryRepository) {
        for (SleepSeedEntry seedEntry : seedEntries) {
            LocalDate sleepDate = LocalDate.now().minusDays(seedEntry.daysAgo());
            LocalDateTime endDateTime = sleepDate.atTime(seedEntry.endHour(), seedEntry.endMinute());

            SleepEntry sleepEntry = new SleepEntry();
            sleepEntry.setUserProfile(profile);
            sleepEntry.setSleepDate(sleepDate);
            sleepEntry.setSleepType(seedEntry.sleepType());
            sleepEntry.setStartDateTime(endDateTime.minusMinutes(seedEntry.durationMinutes()));
            sleepEntry.setEndDateTime(endDateTime);
            sleepEntry.setQualityRating(seedEntry.qualityRating());
            sleepEntry.setNotes(SLEEP_SEED_NOTE_PREFIX
                    + " " + profile.getName() + " / " + seedEntry.seedKey());
            sleepEntryRepository.save(sleepEntry);
        }
    }

    private List<SleepSeedEntry> husbandSleepSeedEntries() {
        return List.of(
                sleepSeedEntry(2, SleepType.NIGHT_SLEEP, 6, 30, 480, 4,
                        "cross-midnight-night-sleep"),
                sleepSeedEntry(2, SleepType.NAP, 14, 0, 30, null,
                        "afternoon-nap-without-quality"),
                sleepSeedEntry(1, SleepType.NIGHT_SLEEP, 7, 0, 480, 5,
                        "night-sleep-with-quality")
        );
    }

    private List<SleepSeedEntry> wifeSleepSeedEntries() {
        return List.of(
                sleepSeedEntry(2, SleepType.NIGHT_SLEEP, 6, 45, 480, 5,
                        "cross-midnight-night-sleep"),
                sleepSeedEntry(2, SleepType.NAP, 13, 45, 45, null,
                        "afternoon-nap-without-quality"),
                sleepSeedEntry(1, SleepType.NIGHT_SLEEP, 6, 45, 450, 4,
                        "night-sleep-with-quality")
        );
    }

    private SleepSeedEntry sleepSeedEntry(
            int daysAgo,
            SleepType sleepType,
            int endHour,
            int endMinute,
            int durationMinutes,
            Integer qualityRating,
            String seedKey) {
        return new SleepSeedEntry(
                daysAgo,
                sleepType,
                endHour,
                endMinute,
                durationMinutes,
                qualityRating,
                seedKey
        );
    }

    private WaterSeedEntry waterSeedEntry(int daysAgo, int amountMl, String seedKey) {
        return new WaterSeedEntry(daysAgo, amountMl, seedKey);
    }

    private List<FoodSeedEntry> husbandFoodSeedEntries() {
        return List.of(
                foodSeedEntry(2, MealType.BREAKFAST, "Greek yogurt berry granola", "1.00", "serving", "420.00", "23.00", "55.00", "12.00"),
                foodSeedEntry(2, MealType.LUNCH, "Tuna pasta salad", "1.00", "serving", "560.00", "38.00", "65.00", "16.00"),
                foodSeedEntry(2, MealType.DINNER, "Chicken curry with rice", "1.00", "serving", "680.00", "46.00", "78.00", "20.00"),
                foodSeedEntry(2, MealType.SNACK, "Protein shake", "1.00", "bottle", "220.00", "25.00", "15.00", "5.00"),
                foodSeedEntry(1, MealType.BREAKFAST, "Egg and wholegrain toast", "1.00", "serving", "380.00", "24.00", "30.00", "18.00"),
                foodSeedEntry(1, MealType.LUNCH, "Turkey avocado wrap", "1.00", "wrap", "520.00", "35.00", "55.00", "18.00"),
                foodSeedEntry(1, MealType.DINNER, "Beef vegetable stir-fry", "1.00", "serving", "650.00", "42.00", "60.00", "24.00"),
                foodSeedEntry(1, MealType.SNACK, "Apple with peanut butter", "1.00", "serving", "280.00", "6.00", "32.00", "14.00"),
                foodSeedEntry(0, MealType.BREAKFAST, "Overnight oats", "1.00", "serving", "360.00", "15.00", "55.00", "10.00"),
                foodSeedEntry(0, MealType.LUNCH, "Chicken rice bowl", "1.00", "bowl", "620.00", "45.00", "75.00", "18.00"),
                foodSeedEntry(0, MealType.DINNER, "Salmon with roasted vegetables", "1.00", "serving", "590.00", "42.00", "35.00", "28.00"),
                foodSeedEntry(0, MealType.SNACK, "Greek yogurt", "170.00", "g", "130.00", "17.00", "8.00", "3.00")
        );
    }

    private List<FoodSeedEntry> wifeFoodSeedEntries() {
        return List.of(
                foodSeedEntry(2, MealType.BREAKFAST, "Berry banana smoothie", "1.00", "glass", "310.00", "16.00", "48.00", "7.00"),
                foodSeedEntry(2, MealType.LUNCH, "Mediterranean chickpea salad", "1.00", "serving", "430.00", "17.00", "55.00", "16.00"),
                foodSeedEntry(2, MealType.DINNER, "Tofu vegetable noodles", "1.00", "serving", "510.00", "25.00", "62.00", "18.00"),
                foodSeedEntry(2, MealType.SNACK, "Almonds", "28.00", "g", "165.00", "6.00", "6.00", "14.00"),
                foodSeedEntry(1, MealType.BREAKFAST, "Egg and avocado toast", "1.00", "serving", "340.00", "16.00", "28.00", "19.00"),
                foodSeedEntry(1, MealType.LUNCH, "Lentil vegetable soup", "1.00", "bowl", "400.00", "22.00", "56.00", "10.00"),
                foodSeedEntry(1, MealType.DINNER, "Grilled chicken quinoa bowl", "1.00", "bowl", "530.00", "41.00", "50.00", "17.00"),
                foodSeedEntry(1, MealType.SNACK, "Cottage cheese with pineapple", "1.00", "serving", "190.00", "18.00", "20.00", "4.00"),
                foodSeedEntry(0, MealType.BREAKFAST, "Oats with berries", "1.00", "serving", "330.00", "14.00", "52.00", "8.00"),
                foodSeedEntry(0, MealType.LUNCH, "Quinoa chickpea salad", "1.00", "serving", "450.00", "20.00", "60.00", "15.00"),
                foodSeedEntry(0, MealType.DINNER, "Grilled chicken with vegetables", "1.00", "serving", "520.00", "40.00", "45.00", "18.00"),
                foodSeedEntry(0, MealType.SNACK, "Fruit yogurt", "1.00", "cup", "180.00", "12.00", "26.00", "3.00")
        );
    }

    private FoodSeedEntry foodSeedEntry(
            int daysAgo,
            MealType mealType,
            String foodName,
            String quantity,
            String unit,
            String calories,
            String proteinG,
            String carbohydratesG,
            String fatG) {
        return new FoodSeedEntry(
                daysAgo,
                mealType,
                foodName,
                new BigDecimal(quantity),
                unit,
                new BigDecimal(calories),
                new BigDecimal(proteinG),
                new BigDecimal(carbohydratesG),
                new BigDecimal(fatG),
                daysAgo + "-" + mealType + "-" + foodName
        );
    }

    private record FoodSeedEntry(
            int daysAgo,
            MealType mealType,
            String foodName,
            BigDecimal quantity,
            String unit,
            BigDecimal calories,
            BigDecimal proteinG,
            BigDecimal carbohydratesG,
            BigDecimal fatG,
            String seedKey
    ) {
    }

    private record WaterSeedEntry(int daysAgo, int amountMl, String seedKey) {
    }

    private record ActivitySeedEntry(
            int daysAgo,
            ActivityCategory category,
            String activityName,
            int durationMinutes,
            Integer steps,
            BigDecimal distanceKm,
            Integer reportedCaloriesBurned,
            String seedKey
    ) {
    }

    private record SleepSeedEntry(
            int daysAgo,
            SleepType sleepType,
            int endHour,
            int endMinute,
            int durationMinutes,
            Integer qualityRating,
            String seedKey
    ) {
    }

    private UserProfile createProfile(
            String name,
            Gender gender,
            int age,
            double heightCm,
            double startingWeightKg,
            double currentWeightKg,
            double targetWeightKg) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setGender(gender);
        profile.setAge(age);
        profile.setHeightCm(heightCm);
        profile.setStartingWeightKg(startingWeightKg);
        profile.setCurrentWeightKg(currentWeightKg);
        profile.setTargetWeightKg(targetWeightKg);
        return profile;
    }
}
