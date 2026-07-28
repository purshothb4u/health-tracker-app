package com.healthaitracker.config;

import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.UserProfile;
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

    @Bean
    CommandLineRunner seedUserProfiles(
            UserProfileRepository userProfileRepository,
            HealthMetricRepository healthMetricRepository,
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
