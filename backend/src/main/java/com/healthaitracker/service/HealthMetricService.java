package com.healthaitracker.service;

import com.healthaitracker.dto.HealthMetricRequest;
import com.healthaitracker.dto.HealthMetricResponse;
import com.healthaitracker.dto.HealthSummary;
import com.healthaitracker.dto.DailyTargetsResponse;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.HealthMetricAlreadyExistsException;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class HealthMetricService {

    private final HealthMetricRepository healthMetricRepository;
    private final UserProfileRepository userProfileRepository;
    private final HealthCalculationService healthCalculationService;
    private final DailyTargetCalculationService dailyTargetCalculationService;

    public HealthMetricService(
            HealthMetricRepository healthMetricRepository,
            UserProfileRepository userProfileRepository,
            HealthCalculationService healthCalculationService,
            DailyTargetCalculationService dailyTargetCalculationService) {
        this.healthMetricRepository = healthMetricRepository;
        this.userProfileRepository = userProfileRepository;
        this.healthCalculationService = healthCalculationService;
        this.dailyTargetCalculationService = dailyTargetCalculationService;
    }

    public List<HealthMetricResponse> getMetrics(Long userProfileId) {
        findUserProfileOrThrow(userProfileId);
        return healthMetricRepository.findByUserProfileIdOrderByMetricDateDesc(userProfileId).stream()
                .map(HealthMetricResponse::fromEntity)
                .toList();
    }

    public HealthMetricResponse getLatestMetric(Long userProfileId) {
        findUserProfileOrThrow(userProfileId);
        return healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(userProfileId)
                .map(HealthMetricResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No health metrics found for user profile with id: " + userProfileId));
    }

    public HealthSummary getHealthSummary(Long userProfileId) {
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        HealthMetric latestMetric = healthMetricRepository
                .findFirstByUserProfileIdOrderByMetricDateDesc(userProfileId)
                .orElse(null);
        DailyTargetsResponse dailyTargets = dailyTargetCalculationService.calculateForProfile(profile);
        BigDecimal latestWeightKg = dailyTargets.currentWeightKg();
        BigDecimal heightCm = BigDecimal.valueOf(profile.getHeightCm());
        HealthCalculationService.WeightProgress progress = healthCalculationService.calculateWeightProgress(
                BigDecimal.valueOf(profile.getStartingWeightKg()),
                latestWeightKg,
                BigDecimal.valueOf(profile.getTargetWeightKg()));

        return new HealthSummary(
                profile.getId(),
                latestWeightKg,
                latestMetric == null ? null : latestMetric.getMetricDate(),
                healthCalculationService.calculateBmi(latestWeightKg, heightCm),
                dailyTargets.bmrKcal(),
                dailyTargets.estimatedMaintenanceKcal(),
                progress.weightLostKg(),
                progress.weightRemainingKg(),
                progress.goalProgressPercent()
        );
    }

    @Transactional
    public HealthMetricResponse createMetric(Long userProfileId, HealthMetricRequest request) {
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        rejectDuplicateMetricDate(userProfileId, request.metricDate(), null);

        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(profile);
        applyRequest(metric, request);

        HealthMetric saved = healthMetricRepository.save(metric);
        synchronizeCurrentWeight(profile);
        return HealthMetricResponse.fromEntity(saved);
    }

    @Transactional
    public HealthMetricResponse updateMetric(Long userProfileId, Long metricId, HealthMetricRequest request) {
        HealthMetric metric = findMetricForUserOrThrow(userProfileId, metricId);
        rejectDuplicateMetricDate(userProfileId, request.metricDate(), metricId);

        applyRequest(metric, request);
        HealthMetric saved = healthMetricRepository.save(metric);
        synchronizeCurrentWeight(metric.getUserProfile());
        return HealthMetricResponse.fromEntity(saved);
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private HealthMetric findMetricForUserOrThrow(Long userProfileId, Long metricId) {
        HealthMetric metric = healthMetricRepository.findById(metricId)
                .orElseThrow(() -> new ResourceNotFoundException("Health metric not found with id: " + metricId));
        if (!metric.getUserProfile().getId().equals(userProfileId)) {
            throw new ResourceNotFoundException("Health metric not found with id: " + metricId);
        }
        return metric;
    }

    private void rejectDuplicateMetricDate(Long userProfileId, LocalDate metricDate, Long currentMetricId) {
        healthMetricRepository.findByUserProfileIdAndMetricDate(userProfileId, metricDate)
                .filter(existingMetric -> !existingMetric.getId().equals(currentMetricId))
                .ifPresent(existingMetric -> {
                    throw new HealthMetricAlreadyExistsException(
                            "A health metric already exists for this user on " + metricDate);
                });
    }

    private void applyRequest(HealthMetric metric, HealthMetricRequest request) {
        metric.setMetricDate(request.metricDate());
        metric.setWeightKg(request.weightKg());
        metric.setNotes(request.notes());
    }

    private void synchronizeCurrentWeight(UserProfile profile) {
        healthMetricRepository.findFirstByUserProfileIdOrderByMetricDateDesc(profile.getId())
                .ifPresent(latestMetric -> profile.setCurrentWeightKg(latestMetric.getWeightKg().doubleValue()));
    }
}
