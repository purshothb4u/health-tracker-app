package com.healthaitracker.service;

import com.healthaitracker.dto.HealthMetricRequest;
import com.healthaitracker.dto.HealthMetricResponse;
import com.healthaitracker.dto.HealthSummary;
import com.healthaitracker.entity.ActivityLevel;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.HealthMetricAlreadyExistsException;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthMetricServiceTest {

    @Mock
    private HealthMetricRepository healthMetricRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private HealthMetricService healthMetricService;

    @BeforeEach
    void setUp() {
        healthMetricService = new HealthMetricService(
                healthMetricRepository,
                userProfileRepository,
                new HealthCalculationService(),
                new DailyTargetCalculationService(
                        userProfileRepository,
                        healthMetricRepository,
                        new HealthCalculationService()));
    }

    @Test
    void createsMetricAndSynchronizesProfileCurrentWeightToLatestMetric() {
        UserProfile profile = createProfile(1L);
        HealthMetric latestMetric = createMetric(profile, 10L, LocalDate.now(), "82.50");
        HealthMetricRequest request = new HealthMetricRequest(LocalDate.now().minusDays(1),
                new BigDecimal("84.00"), "Earlier record");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(healthMetricRepository.findByUserProfileIdAndMetricDate(1L, request.metricDate()))
                .thenReturn(Optional.empty());
        when(healthMetricRepository.save(any(HealthMetric.class))).thenAnswer(invocation -> {
            HealthMetric metric = invocation.getArgument(0);
            metric.setId(11L);
            return metric;
        });
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L))
                .thenReturn(Optional.of(latestMetric));

        HealthMetricResponse response = healthMetricService.createMetric(1L, request);

        ArgumentCaptor<HealthMetric> metricCaptor = ArgumentCaptor.forClass(HealthMetric.class);
        verify(healthMetricRepository).save(metricCaptor.capture());
        assertThat(metricCaptor.getValue().getUserProfile()).isSameAs(profile);
        assertThat(response.id()).isEqualTo(11L);
        assertThat(profile.getCurrentWeightKg()).isEqualTo(82.5);
    }

    @Test
    void rejectsDuplicateMetricDateForUser() {
        UserProfile profile = createProfile(1L);
        LocalDate metricDate = LocalDate.now();
        HealthMetric existingMetric = createMetric(profile, 10L, metricDate, "85.00");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(healthMetricRepository.findByUserProfileIdAndMetricDate(eq(1L), eq(metricDate)))
                .thenReturn(Optional.of(existingMetric));

        assertThatThrownBy(() -> healthMetricService.createMetric(
                1L, new HealthMetricRequest(metricDate, new BigDecimal("84.00"), null)))
                .isInstanceOf(HealthMetricAlreadyExistsException.class)
                .hasMessageContaining(metricDate.toString());
    }

    @Test
    void healthSummaryUsesCentralActivityAdjustedMaintenanceEstimate() {
        UserProfile profile = createProfile(1L);
        profile.setActivityLevel(ActivityLevel.VERY_ACTIVE);
        HealthMetric latestMetric = createMetric(profile, 10L, LocalDate.now(), "80.00");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(1L))
                .thenReturn(Optional.of(latestMetric));

        HealthSummary summary = healthMetricService.getHealthSummary(1L);

        assertThat(summary.latestWeightKg()).isEqualByComparingTo("80.00");
        assertThat(summary.bmrCaloriesPerDay()).isEqualByComparingTo("1749");
        assertThat(summary.maintenanceCaloriesPerDay()).isEqualByComparingTo("3017");
    }

    private UserProfile createProfile(Long id) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setName("Test profile");
        profile.setGender(Gender.MALE);
        profile.setAge(30);
        profile.setHeightCm(175.0);
        profile.setStartingWeightKg(87.0);
        profile.setCurrentWeightKg(87.0);
        profile.setTargetWeightKg(75.0);
        return profile;
    }

    private HealthMetric createMetric(UserProfile profile, Long id, LocalDate metricDate, String weightKg) {
        HealthMetric metric = new HealthMetric();
        metric.setId(id);
        metric.setUserProfile(profile);
        metric.setMetricDate(metricDate);
        metric.setWeightKg(new BigDecimal(weightKg));
        return metric;
    }
}
