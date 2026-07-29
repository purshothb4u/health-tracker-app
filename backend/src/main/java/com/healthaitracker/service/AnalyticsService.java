package com.healthaitracker.service;

import com.healthaitracker.dto.AnalyticsResponse;
import com.healthaitracker.dto.DailyNutritionDataPoint;
import com.healthaitracker.dto.NutritionAnalytics;
import com.healthaitracker.dto.WeightAnalytics;
import com.healthaitracker.dto.WeightDataPoint;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.AnalyticsDateRangeException;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final int MAXIMUM_RANGE_DAYS = 365;
    private static final int DECIMAL_SCALE = 2;
    private static final BigDecimal ZERO_NUTRITION = new BigDecimal("0.00");
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final UserProfileRepository userProfileRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final HealthCalculationService healthCalculationService;

    public AnalyticsService(
            UserProfileRepository userProfileRepository,
            HealthMetricRepository healthMetricRepository,
            FoodEntryRepository foodEntryRepository,
            HealthCalculationService healthCalculationService) {
        this.userProfileRepository = userProfileRepository;
        this.healthMetricRepository = healthMetricRepository;
        this.foodEntryRepository = foodEntryRepository;
        this.healthCalculationService = healthCalculationService;
    }

    public AnalyticsResponse getAnalytics(Long userProfileId, LocalDate fromDate, LocalDate toDate) {
        int totalDaysInRange = validateDateRange(fromDate, toDate);
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        List<HealthMetric> metrics = healthMetricRepository
                .findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(userProfileId, fromDate, toDate);
        List<FoodEntry> foodEntries = foodEntryRepository
                .findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(userProfileId, fromDate, toDate);

        return new AnalyticsResponse(
                userProfileId,
                fromDate,
                toDate,
                calculateWeightAnalytics(profile, metrics, totalDaysInRange),
                calculateNutritionAnalytics(profile, foodEntries, fromDate, toDate, totalDaysInRange)
        );
    }

    private int validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null) {
            throw new AnalyticsDateRangeException("From date is required");
        }
        if (toDate == null) {
            throw new AnalyticsDateRangeException("To date is required");
        }
        if (fromDate.isAfter(toDate)) {
            throw new AnalyticsDateRangeException("From date must not be after to date");
        }
        if (toDate.isAfter(LocalDate.now())) {
            throw new AnalyticsDateRangeException("To date must not be in the future");
        }

        int totalDaysInRange = Math.toIntExact(ChronoUnit.DAYS.between(fromDate, toDate) + 1);
        if (totalDaysInRange > MAXIMUM_RANGE_DAYS) {
            throw new AnalyticsDateRangeException("Analytics date range must not exceed 365 days");
        }
        return totalDaysInRange;
    }

    private WeightAnalytics calculateWeightAnalytics(
            UserProfile profile,
            List<HealthMetric> metrics,
            int totalDaysInRange) {
        BigDecimal targetWeightKg = BigDecimal.valueOf(profile.getTargetWeightKg());
        List<WeightDataPoint> weightDataPoints = metrics.stream()
                .map(metric -> new WeightDataPoint(metric.getMetricDate(), metric.getWeightKg()))
                .toList();

        if (metrics.isEmpty()) {
            return new WeightAnalytics(
                    null, null, null, null, null, null, null,
                    targetWeightKg, null, null, 0, totalDaysInRange, weightDataPoints);
        }

        BigDecimal firstWeightKg = metrics.getFirst().getWeightKg();
        BigDecimal lastWeightKg = metrics.getLast().getWeightKg();
        BigDecimal lowestWeightKg = metrics.stream().map(HealthMetric::getWeightKg)
                .min(BigDecimal::compareTo).orElseThrow();
        BigDecimal highestWeightKg = metrics.stream().map(HealthMetric::getWeightKg)
                .max(BigDecimal::compareTo).orElseThrow();
        BigDecimal averageWeightKg = average(metrics.stream().map(HealthMetric::getWeightKg).toList());

        BigDecimal weightChangeKg = null;
        BigDecimal weightChangePercentage = null;
        if (metrics.size() >= 2) {
            weightChangeKg = lastWeightKg.subtract(firstWeightKg).setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
            weightChangePercentage = weightChangeKg.multiply(ONE_HUNDRED)
                    .divide(firstWeightKg, DECIMAL_SCALE, RoundingMode.HALF_UP);
        }

        HealthCalculationService.WeightProgress progress = healthCalculationService.calculateWeightProgress(
                BigDecimal.valueOf(profile.getStartingWeightKg()),
                lastWeightKg,
                targetWeightKg);

        return new WeightAnalytics(
                firstWeightKg,
                lastWeightKg,
                weightChangeKg,
                weightChangePercentage,
                lowestWeightKg,
                highestWeightKg,
                averageWeightKg,
                targetWeightKg,
                progress.weightRemainingKg(),
                progress.goalProgressPercent(),
                metrics.size(),
                totalDaysInRange,
                weightDataPoints
        );
    }

    private NutritionAnalytics calculateNutritionAnalytics(
            UserProfile profile,
            List<FoodEntry> foodEntries,
            LocalDate fromDate,
            LocalDate toDate,
            int totalDaysInRange) {
        Map<LocalDate, List<FoodEntry>> entriesByDate = foodEntries.stream()
                .collect(Collectors.groupingBy(FoodEntry::getEntryDate));
        List<DailyNutritionDataPoint> dailyDataPoints = fromDate.datesUntil(toDate.plusDays(1))
                .map(date -> createDailyNutritionDataPoint(date, entriesByDate.getOrDefault(date, List.of())))
                .toList();

        int daysWithFoodLogs = (int) dailyDataPoints.stream()
                .filter(dataPoint -> dataPoint.foodEntryCount() > 0)
                .count();
        BigDecimal totalCalories = sum(dailyDataPoints, DailyNutritionDataPoint::totalCalories);
        BigDecimal totalProteinGrams = sum(dailyDataPoints, DailyNutritionDataPoint::totalProteinGrams);
        BigDecimal totalCarbohydrateGrams = sum(dailyDataPoints, DailyNutritionDataPoint::totalCarbohydrateGrams);
        BigDecimal totalFatGrams = sum(dailyDataPoints, DailyNutritionDataPoint::totalFatGrams);
        BigDecimal maintenanceCaloriesEstimate = calculateCurrentMaintenanceCaloriesEstimate(profile);

        Integer daysBelowMaintenance = null;
        Integer daysAtOrAboveMaintenance = null;
        if (maintenanceCaloriesEstimate != null) {
            daysBelowMaintenance = (int) dailyDataPoints.stream()
                    .filter(dataPoint -> dataPoint.foodEntryCount() > 0)
                    .filter(dataPoint -> dataPoint.totalCalories().compareTo(maintenanceCaloriesEstimate) < 0)
                    .count();
            daysAtOrAboveMaintenance = daysWithFoodLogs - daysBelowMaintenance;
        }

        return new NutritionAnalytics(
                totalCalories,
                averageForLoggedDays(totalCalories, daysWithFoodLogs),
                averageForLoggedDays(totalProteinGrams, daysWithFoodLogs),
                averageForLoggedDays(totalCarbohydrateGrams, daysWithFoodLogs),
                averageForLoggedDays(totalFatGrams, daysWithFoodLogs),
                totalDaysInRange,
                daysWithFoodLogs,
                totalDaysInRange - daysWithFoodLogs,
                maintenanceCaloriesEstimate,
                daysBelowMaintenance,
                daysAtOrAboveMaintenance,
                dailyDataPoints
        );
    }

    private DailyNutritionDataPoint createDailyNutritionDataPoint(LocalDate date, List<FoodEntry> entries) {
        return new DailyNutritionDataPoint(
                date,
                sum(entries, FoodEntry::getCalories),
                sum(entries, FoodEntry::getProteinG),
                sum(entries, FoodEntry::getCarbohydratesG),
                sum(entries, FoodEntry::getFatG),
                entries.size()
        );
    }

    private BigDecimal calculateCurrentMaintenanceCaloriesEstimate(UserProfile profile) {
        HealthMetric latestMetric = healthMetricRepository
                .findFirstByUserProfileIdOrderByMetricDateDesc(profile.getId())
                .orElse(null);
        BigDecimal currentWeightKg = latestMetric == null
                ? BigDecimal.valueOf(profile.getCurrentWeightKg())
                : latestMetric.getWeightKg();
        BigDecimal bmr = healthCalculationService.calculateBmr(
                currentWeightKg,
                BigDecimal.valueOf(profile.getHeightCm()),
                profile.getAge(),
                profile.getGender());
        return healthCalculationService.calculateMaintenanceCalories(bmr);
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private BigDecimal average(List<BigDecimal> values) {
        return sum(values, Function.identity())
                .divide(BigDecimal.valueOf(values.size()), DECIMAL_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal averageForLoggedDays(BigDecimal total, int daysWithFoodLogs) {
        return daysWithFoodLogs == 0
                ? null
                : total.divide(BigDecimal.valueOf(daysWithFoodLogs), DECIMAL_SCALE, RoundingMode.HALF_UP);
    }

    private <T> BigDecimal sum(List<T> values, Function<T, BigDecimal> valueExtractor) {
        return values.stream()
                .map(valueExtractor)
                .reduce(ZERO_NUTRITION, BigDecimal::add)
                .setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
    }
}
