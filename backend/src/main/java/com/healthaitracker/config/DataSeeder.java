package com.healthaitracker.config;

import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.MealType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String FOOD_SEED_NOTE_PREFIX = "Development seed data: ";

    @Bean
    CommandLineRunner seedUserProfiles(
            UserProfileRepository userProfileRepository,
            HealthMetricRepository healthMetricRepository,
            FoodEntryRepository foodEntryRepository,
            @Value("${app.seed-data.enabled:true}") boolean seedEnabled) {
        return args -> {
            if (!seedEnabled) {
                return;
            }

            List<UserProfile> profiles = userProfileRepository.count() == 0
                    ? seedUserProfiles(userProfileRepository)
                    : userProfileRepository.findAll();

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
                return;
            }

            profiles.stream()
                    .filter(profile -> "Husband".equals(profile.getName()))
                    .findFirst()
                    .ifPresent(profile -> seedFoodEntries(profile, husbandFoodSeedEntries(), foodEntryRepository));

            profiles.stream()
                    .filter(profile -> "Wife".equals(profile.getName()))
                    .findFirst()
                    .ifPresent(profile -> seedFoodEntries(profile, wifeFoodSeedEntries(), foodEntryRepository));
        };
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
