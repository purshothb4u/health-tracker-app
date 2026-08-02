package com.healthaitracker.service;

import com.healthaitracker.entity.ActivityEntry;
import com.healthaitracker.entity.ChallengeCheckIn;
import com.healthaitracker.entity.CoupleChallenge;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalCheckIn;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.SleepEntry;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.entity.WaterEntry;
import com.healthaitracker.entity.WaterGoal;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.ChallengeCheckInRepository;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.GoalCheckInRepository;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.SleepEntryRepository;
import com.healthaitracker.repository.WaterEntryRepository;
import com.healthaitracker.repository.WaterGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ProgressCalculationService {

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final int PERCENTAGE_SCALE = 2;
    private static final String WATER_GOAL_UNAVAILABLE_MESSAGE =
            "Configure a water goal to calculate progress.";

    private final ActivityEntryRepository activityEntryRepository;
    private final WaterEntryRepository waterEntryRepository;
    private final WaterGoalRepository waterGoalRepository;
    private final SleepEntryRepository sleepEntryRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final GoalCheckInRepository goalCheckInRepository;
    private final ChallengeCheckInRepository challengeCheckInRepository;

    public ProgressCalculationService(
            ActivityEntryRepository activityEntryRepository,
            WaterEntryRepository waterEntryRepository,
            WaterGoalRepository waterGoalRepository,
            SleepEntryRepository sleepEntryRepository,
            HealthMetricRepository healthMetricRepository,
            FoodEntryRepository foodEntryRepository,
            GoalCheckInRepository goalCheckInRepository,
            ChallengeCheckInRepository challengeCheckInRepository) {
        this.activityEntryRepository = activityEntryRepository;
        this.waterEntryRepository = waterEntryRepository;
        this.waterGoalRepository = waterGoalRepository;
        this.sleepEntryRepository = sleepEntryRepository;
        this.healthMetricRepository = healthMetricRepository;
        this.foodEntryRepository = foodEntryRepository;
        this.goalCheckInRepository = goalCheckInRepository;
        this.challengeCheckInRepository = challengeCheckInRepository;
    }

    public ProgressCalculationResult calculateGoalProgress(Goal goal, LocalDate today) {
        validateGoal(goal, today);
        String displayUnit = switch (goal.getGoalType()) {
            case ACTIVITY_MINUTES -> "minutes";
            case WATER_GOAL_DAYS, SLEEP_TARGET_DAYS, HEALTH_LOGGING_STREAK -> "days";
            case CUSTOM_CHECK_IN -> customDisplayUnit(goal.getCustomUnit());
        };
        EvaluationWindow window = evaluationWindow(goal.getStartDate(), goal.getEndDate(), today);
        if (window == null) {
            return availableResult(0L, goal.getTargetValue(), displayUnit);
        }

        Long profileId = goal.getUserProfile().getId();
        return switch (goal.getGoalType()) {
            case ACTIVITY_MINUTES -> availableResult(
                    calculateActivityMinutes(profileId, window),
                    goal.getTargetValue(),
                    displayUnit);
            case WATER_GOAL_DAYS -> calculateWaterGoalDays(
                    profileId,
                    window,
                    goal.getTargetValue(),
                    displayUnit);
            case SLEEP_TARGET_DAYS -> availableResult(
                    calculateSleepTargetDays(profileId, window, requireSleepThreshold(
                            goal.getQualifyingSleepMinutes())),
                    goal.getTargetValue(),
                    displayUnit);
            case HEALTH_LOGGING_STREAK -> availableResult(
                    calculateHealthLoggingStreak(profileId, window),
                    goal.getTargetValue(),
                    displayUnit);
            case CUSTOM_CHECK_IN -> availableResult(
                    calculateGoalCheckIns(goal.getId(), window),
                    goal.getTargetValue(),
                    displayUnit);
        };
    }

    public ProgressCalculationResult calculateChallengeProgress(
            CoupleChallenge challenge,
            CoupleChallengeParticipant participant,
            LocalDate today) {
        validateChallenge(challenge, participant, today);
        String displayUnit = switch (challenge.getChallengeType()) {
            case ACTIVITY_MINUTES -> "minutes";
            case WATER_GOAL_DAYS, SLEEP_TARGET_DAYS, HEALTH_LOGGING_STREAK -> "days";
            case CUSTOM_CHECK_IN -> customDisplayUnit(challenge.getCustomUnit());
        };
        EvaluationWindow window = evaluationWindow(
                challenge.getStartDate(),
                challenge.getEndDate(),
                today);
        if (window == null) {
            return availableResult(0L, challenge.getTargetValue(), displayUnit);
        }

        Long profileId = participant.getUserProfile().getId();
        return switch (challenge.getChallengeType()) {
            case ACTIVITY_MINUTES -> availableResult(
                    calculateActivityMinutes(profileId, window),
                    challenge.getTargetValue(),
                    displayUnit);
            case WATER_GOAL_DAYS -> calculateWaterGoalDays(
                    profileId,
                    window,
                    challenge.getTargetValue(),
                    displayUnit);
            case SLEEP_TARGET_DAYS -> availableResult(
                    calculateSleepTargetDays(profileId, window, requireSleepThreshold(
                            challenge.getQualifyingSleepMinutes())),
                    challenge.getTargetValue(),
                    displayUnit);
            case HEALTH_LOGGING_STREAK -> availableResult(
                    calculateHealthLoggingStreak(profileId, window),
                    challenge.getTargetValue(),
                    displayUnit);
            case CUSTOM_CHECK_IN -> availableResult(
                    calculateChallengeCheckIns(participant.getId(), window),
                    challenge.getTargetValue(),
                    displayUnit);
        };
    }

    private long calculateActivityMinutes(Long profileId, EvaluationWindow window) {
        return activityEntryRepository
                .findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .filter(entry -> isWithinWindow(entry.getActivityDate(), window))
                .map(ActivityEntry::getDurationMinutes)
                .filter(Objects::nonNull)
                .mapToLong(Integer::longValue)
                .sum();
    }

    private ProgressCalculationResult calculateWaterGoalDays(
            Long profileId,
            EvaluationWindow window,
            Long targetValue,
            String displayUnit) {
        WaterGoal waterGoal = waterGoalRepository.findByUserProfileId(profileId).orElse(null);
        if (waterGoal == null) {
            return unavailableResult(targetValue, displayUnit, WATER_GOAL_UNAVAILABLE_MESSAGE);
        }

        Map<LocalDate, Long> totalsByDate = new HashMap<>();
        List<WaterEntry> entries = waterEntryRepository
                .findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate());
        for (WaterEntry entry : entries) {
            if (isWithinWindow(entry.getEntryDate(), window)) {
                totalsByDate.merge(entry.getEntryDate(), entry.getAmountMl().longValue(), Long::sum);
            }
        }

        long currentGoalMl = waterGoal.getDailyGoalMl().longValue();
        long qualifyingDays = totalsByDate.values().stream()
                .filter(totalMl -> totalMl >= currentGoalMl)
                .count();
        return availableResult(qualifyingDays, targetValue, displayUnit);
    }

    private long calculateSleepTargetDays(
            Long profileId,
            EvaluationWindow window,
            int qualifyingSleepMinutes) {
        Map<LocalDate, Long> totalsByDate = new HashMap<>();
        List<SleepEntry> entries = sleepEntryRepository
                .findByUserProfileIdAndSleepDateBetweenOrderBySleepDateAscStartDateTimeAscCreatedAtAscIdAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate());
        for (SleepEntry entry : entries) {
            if (isWithinWindow(entry.getSleepDate(), window)) {
                long durationMinutes = Duration.between(
                        entry.getStartDateTime(),
                        entry.getEndDateTime()).toMinutes();
                totalsByDate.merge(entry.getSleepDate(), durationMinutes, Long::sum);
            }
        }
        return totalsByDate.values().stream()
                .filter(totalMinutes -> totalMinutes >= qualifyingSleepMinutes)
                .count();
    }

    private long calculateHealthLoggingStreak(Long profileId, EvaluationWindow window) {
        Set<LocalDate> loggedDates = new HashSet<>();
        healthMetricRepository
                .findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .map(HealthMetric::getMetricDate)
                .filter(date -> isWithinWindow(date, window))
                .forEach(loggedDates::add);
        foodEntryRepository
                .findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .map(FoodEntry::getEntryDate)
                .filter(date -> isWithinWindow(date, window))
                .forEach(loggedDates::add);
        waterEntryRepository
                .findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .map(WaterEntry::getEntryDate)
                .filter(date -> isWithinWindow(date, window))
                .forEach(loggedDates::add);
        activityEntryRepository
                .findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .map(ActivityEntry::getActivityDate)
                .filter(date -> isWithinWindow(date, window))
                .forEach(loggedDates::add);
        sleepEntryRepository
                .findByUserProfileIdAndSleepDateBetweenOrderBySleepDateAscStartDateTimeAscCreatedAtAscIdAsc(
                        profileId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .map(SleepEntry::getSleepDate)
                .filter(date -> isWithinWindow(date, window))
                .forEach(loggedDates::add);

        List<LocalDate> orderedDates = loggedDates.stream()
                .sorted(Comparator.naturalOrder())
                .toList();
        long longestStreak = 0L;
        long currentStreak = 0L;
        LocalDate previousDate = null;
        for (LocalDate loggedDate : orderedDates) {
            currentStreak = previousDate != null && loggedDate.equals(previousDate.plusDays(1))
                    ? currentStreak + 1L
                    : 1L;
            longestStreak = Math.max(longestStreak, currentStreak);
            previousDate = loggedDate;
        }
        return longestStreak;
    }

    private long calculateGoalCheckIns(Long goalId, EvaluationWindow window) {
        return goalCheckInRepository
                .findByGoalIdAndCheckInDateBetweenOrderByCheckInDateAscCreatedAtAscIdAsc(
                        goalId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .filter(GoalCheckIn::isCompleted)
                .filter(checkIn -> isWithinWindow(checkIn.getCheckInDate(), window))
                .map(GoalCheckIn::getCheckInDate)
                .distinct()
                .count();
    }

    private long calculateChallengeCheckIns(Long participantId, EvaluationWindow window) {
        return challengeCheckInRepository
                .findByParticipantIdAndCheckInDateBetweenOrderByCheckInDateAscCreatedAtAscIdAsc(
                        participantId,
                        window.fromDate(),
                        window.toDate())
                .stream()
                .filter(ChallengeCheckIn::isCompleted)
                .filter(checkIn -> isWithinWindow(checkIn.getCheckInDate(), window))
                .map(ChallengeCheckIn::getCheckInDate)
                .distinct()
                .count();
    }

    private ProgressCalculationResult availableResult(
            long currentValue,
            Long targetValue,
            String displayUnit) {
        BigDecimal percentage = BigDecimal.valueOf(currentValue)
                .multiply(ONE_HUNDRED)
                .divide(BigDecimal.valueOf(targetValue), PERCENTAGE_SCALE, RoundingMode.HALF_UP);
        return new ProgressCalculationResult(
                currentValue,
                targetValue,
                percentage,
                currentValue >= targetValue,
                true,
                displayUnit,
                null
        );
    }

    private ProgressCalculationResult unavailableResult(
            Long targetValue,
            String displayUnit,
            String message) {
        return new ProgressCalculationResult(
                null,
                targetValue,
                null,
                null,
                false,
                displayUnit,
                message
        );
    }

    private EvaluationWindow evaluationWindow(
            LocalDate startDate,
            LocalDate endDate,
            LocalDate today) {
        if (today.isBefore(startDate)) {
            return null;
        }
        return new EvaluationWindow(startDate, endDate.isBefore(today) ? endDate : today);
    }

    private boolean isWithinWindow(LocalDate date, EvaluationWindow window) {
        return date != null
                && !date.isBefore(window.fromDate())
                && !date.isAfter(window.toDate());
    }

    private int requireSleepThreshold(Integer qualifyingSleepMinutes) {
        if (qualifyingSleepMinutes == null
                || qualifyingSleepMinutes < 1
                || qualifyingSleepMinutes > 1440) {
            throw new IllegalArgumentException(
                    "Qualifying sleep minutes must be between 1 and 1440");
        }
        return qualifyingSleepMinutes;
    }

    private String customDisplayUnit(String customUnit) {
        if (customUnit == null || customUnit.isBlank()) {
            return "check-ins";
        }
        return customUnit.trim();
    }

    private void validateGoal(Goal goal, LocalDate today) {
        if (goal == null) {
            throw new IllegalArgumentException("Goal is required");
        }
        validateCommonConfiguration(
                goal.getStartDate(),
                goal.getEndDate(),
                goal.getTargetValue(),
                today);
        if (goal.getGoalType() == null) {
            throw new IllegalArgumentException("Goal type is required");
        }
        validateProfile(goal.getUserProfile());
        if (goal.getGoalType() == com.healthaitracker.entity.GoalType.CUSTOM_CHECK_IN
                && goal.getId() == null) {
            throw new IllegalArgumentException("Persisted goal id is required for check-in progress");
        }
    }

    private void validateChallenge(
            CoupleChallenge challenge,
            CoupleChallengeParticipant participant,
            LocalDate today) {
        if (challenge == null) {
            throw new IllegalArgumentException("Couple challenge is required");
        }
        if (participant == null) {
            throw new IllegalArgumentException("Challenge participant is required");
        }
        validateCommonConfiguration(
                challenge.getStartDate(),
                challenge.getEndDate(),
                challenge.getTargetValue(),
                today);
        if (challenge.getChallengeType() == null) {
            throw new IllegalArgumentException("Challenge type is required");
        }
        validateProfile(participant.getUserProfile());

        CoupleChallenge participantChallenge = participant.getCoupleChallenge();
        boolean sameReference = participantChallenge == challenge;
        boolean samePersistedChallenge = participantChallenge != null
                && challenge.getId() != null
                && challenge.getId().equals(participantChallenge.getId());
        if (!sameReference && !samePersistedChallenge) {
            throw new IllegalArgumentException("Participant does not belong to the couple challenge");
        }
        if (challenge.getChallengeType() == com.healthaitracker.entity.ChallengeType.CUSTOM_CHECK_IN
                && participant.getId() == null) {
            throw new IllegalArgumentException(
                    "Persisted participant id is required for check-in progress");
        }
    }

    private void validateCommonConfiguration(
            LocalDate startDate,
            LocalDate endDate,
            Long targetValue,
            LocalDate today) {
        if (today == null) {
            throw new IllegalArgumentException("Today is required");
        }
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must not be before start date");
        }
        if (targetValue == null || targetValue <= 0L) {
            throw new IllegalArgumentException("Target value must be positive");
        }
    }

    private void validateProfile(UserProfile profile) {
        if (profile == null || profile.getId() == null) {
            throw new IllegalArgumentException("Persisted user profile is required");
        }
    }

    private record EvaluationWindow(LocalDate fromDate, LocalDate toDate) {
    }
}
