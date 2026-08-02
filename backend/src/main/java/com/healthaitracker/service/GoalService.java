package com.healthaitracker.service;

import com.healthaitracker.dto.GoalCheckInResponse;
import com.healthaitracker.dto.GoalProgressResponse;
import com.healthaitracker.dto.GoalRequest;
import com.healthaitracker.dto.GoalResponse;
import com.healthaitracker.dto.GoalStatusRequest;
import com.healthaitracker.dto.ProgressCheckInRequest;
import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalCheckIn;
import com.healthaitracker.entity.GoalStatus;
import com.healthaitracker.entity.GoalType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.GoalCheckInRepository;
import com.healthaitracker.repository.GoalRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class GoalService {

    private static final int MAXIMUM_TITLE_LENGTH = 100;
    private static final int MAXIMUM_NOTES_LENGTH = 500;
    private static final int MAXIMUM_CUSTOM_UNIT_LENGTH = 30;
    private static final long MAXIMUM_GOAL_DAYS = 365L;
    private static final long MAXIMUM_ACTIVITY_MINUTES = 525_600L;
    private static final int MAXIMUM_SLEEP_MINUTES = 1_440;

    private final GoalRepository goalRepository;
    private final GoalCheckInRepository goalCheckInRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProgressCalculationService progressCalculationService;

    public GoalService(
            GoalRepository goalRepository,
            GoalCheckInRepository goalCheckInRepository,
            UserProfileRepository userProfileRepository,
            ProgressCalculationService progressCalculationService) {
        this.goalRepository = goalRepository;
        this.goalCheckInRepository = goalCheckInRepository;
        this.userProfileRepository = userProfileRepository;
        this.progressCalculationService = progressCalculationService;
    }

    @Transactional
    public GoalResponse createGoal(Long userProfileId, GoalRequest request) {
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        ValidatedGoalRequest validated = validateGoalRequest(request);
        Goal goal = new Goal();
        goal.setUserProfile(profile);
        goal.setGoalType(validated.goalType());
        goal.setStatus(GoalStatus.ACTIVE);
        applyValidatedRequest(goal, validated);
        return toGoalResponse(goalRepository.save(goal));
    }

    public List<GoalResponse> getGoals(Long userProfileId, GoalStatus optionalStatus) {
        findUserProfileOrThrow(userProfileId);
        List<Goal> goals = optionalStatus == null
                ? goalRepository.findByUserProfileIdOrderByCreatedAtAscIdAsc(userProfileId)
                : goalRepository.findByUserProfileIdAndStatusOrderByCreatedAtAscIdAsc(
                        userProfileId,
                        optionalStatus);
        return goals.stream().map(this::toGoalResponse).toList();
    }

    public GoalResponse getGoal(Long userProfileId, Long goalId) {
        return toGoalResponse(findGoalForUserOrThrow(userProfileId, goalId));
    }

    @Transactional
    public GoalResponse updateGoal(Long userProfileId, Long goalId, GoalRequest request) {
        Goal goal = findGoalForUserOrThrow(userProfileId, goalId);
        requireActive(goal, "Only active goals may be edited");
        ValidatedGoalRequest validated = validateGoalRequest(request);
        if (goal.getGoalType() != validated.goalType()) {
            throw new IllegalArgumentException("Goal type cannot be changed after creation");
        }
        rejectDateRangeExcludingCheckIns(goalId, validated.startDate(), validated.endDate());
        applyValidatedRequest(goal, validated);
        return toGoalResponse(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse updateGoalStatus(
            Long userProfileId,
            Long goalId,
            GoalStatusRequest request) {
        Goal goal = findGoalForUserOrThrow(userProfileId, goalId);
        if (request == null || request.status() == null) {
            throw new IllegalArgumentException("Goal status is required");
        }
        requireActive(goal, "Completed and cancelled goals cannot be reopened");
        LocalDateTime now = LocalDateTime.now();
        if (request.status() == GoalStatus.COMPLETED) {
            goal.setStatus(GoalStatus.COMPLETED);
            goal.setCompletedAt(now);
            goal.setCancelledAt(null);
        } else if (request.status() == GoalStatus.CANCELLED) {
            goal.setStatus(GoalStatus.CANCELLED);
            goal.setCancelledAt(now);
            goal.setCompletedAt(null);
        } else {
            throw new IllegalArgumentException("Active goals may only be completed or cancelled");
        }
        return toGoalResponse(goalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(Long userProfileId, Long goalId) {
        Goal goal = findGoalForUserOrThrow(userProfileId, goalId);
        goalCheckInRepository.deleteByGoalId(goalId);
        goalRepository.delete(goal);
    }

    public GoalProgressResponse getGoalProgress(Long userProfileId, Long goalId, LocalDate today) {
        Goal goal = findGoalForUserOrThrow(userProfileId, goalId);
        ProgressCalculationResult result = progressCalculationService.calculateGoalProgress(goal, today);
        return new GoalProgressResponse(
                goal.getId(),
                goal.getUserProfile().getId(),
                goal.getGoalType(),
                result.currentValue(),
                result.targetValue(),
                displayUnit(goal),
                result.progressPercentage(),
                calculatePoints(result),
                result.goalReached(),
                result.progressAvailable(),
                result.message()
        );
    }

    @Transactional
    public GoalCheckInResponse upsertGoalCheckIn(
            Long userProfileId,
            Long goalId,
            LocalDate date,
            ProgressCheckInRequest request) {
        Goal goal = findGoalForUserOrThrow(userProfileId, goalId);
        requireActive(goal, "Only active goals may receive check-ins");
        if (goal.getGoalType() != GoalType.CUSTOM_CHECK_IN) {
            throw new IllegalArgumentException("Check-ins are only available for custom check-in goals");
        }
        validateCheckIn(date, request, goal);
        GoalCheckIn checkIn = goalCheckInRepository.findByGoalIdAndCheckInDate(goalId, date)
                .orElseGet(() -> {
                    GoalCheckIn newCheckIn = new GoalCheckIn();
                    newCheckIn.setGoal(goal);
                    newCheckIn.setCheckInDate(date);
                    return newCheckIn;
                });
        checkIn.setCompleted(request.completed());
        checkIn.setNotes(normalizeOptional(request.notes()));
        return toGoalCheckInResponse(goalCheckInRepository.save(checkIn));
    }

    private ValidatedGoalRequest validateGoalRequest(GoalRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Goal request is required");
        }
        String title = normalizeRequiredTitle(request.title());
        if (request.goalType() == null) {
            throw new IllegalArgumentException("Goal type is required");
        }
        if (request.startDate() == null || request.endDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("End date must not be before start date");
        }
        long inclusiveDays = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1L;
        if (inclusiveDays > MAXIMUM_GOAL_DAYS) {
            throw new IllegalArgumentException("Goal duration must not exceed 365 days");
        }
        if (request.targetValue() == null || request.targetValue() <= 0L) {
            throw new IllegalArgumentException("Target value must be positive");
        }
        if (isDayBased(request.goalType()) && request.targetValue() > inclusiveDays) {
            throw new IllegalArgumentException("Target value must not exceed the inclusive goal duration");
        }
        if (request.goalType() == GoalType.ACTIVITY_MINUTES
                && request.targetValue() > MAXIMUM_ACTIVITY_MINUTES) {
            throw new IllegalArgumentException("Activity target must not exceed 525600 minutes");
        }
        validateTypeSpecificConfiguration(request);
        if (request.notes() != null && request.notes().length() > MAXIMUM_NOTES_LENGTH) {
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
        String customUnit = normalizeOptional(request.customUnit());
        if (customUnit != null && customUnit.length() > MAXIMUM_CUSTOM_UNIT_LENGTH) {
            throw new IllegalArgumentException("Custom unit must not exceed 30 characters");
        }
        return new ValidatedGoalRequest(
                title,
                request.goalType(),
                request.startDate(),
                request.endDate(),
                request.targetValue(),
                request.qualifyingSleepMinutes(),
                customUnit,
                normalizeOptional(request.notes()));
    }

    private void validateTypeSpecificConfiguration(GoalRequest request) {
        if (request.goalType() == GoalType.SLEEP_TARGET_DAYS) {
            if (request.qualifyingSleepMinutes() == null
                    || request.qualifyingSleepMinutes() < 1
                    || request.qualifyingSleepMinutes() > MAXIMUM_SLEEP_MINUTES) {
                throw new IllegalArgumentException(
                        "Qualifying sleep minutes must be between 1 and 1440");
            }
        } else if (request.qualifyingSleepMinutes() != null) {
            throw new IllegalArgumentException(
                    "Qualifying sleep minutes are only available for sleep target goals");
        }
        if (request.goalType() != GoalType.CUSTOM_CHECK_IN
                && normalizeOptional(request.customUnit()) != null) {
            throw new IllegalArgumentException("Custom unit is only available for custom check-in goals");
        }
    }

    private void validateCheckIn(LocalDate date, ProgressCheckInRequest request, Goal goal) {
        if (date == null) {
            throw new IllegalArgumentException("Check-in date is required");
        }
        if (date.isBefore(goal.getStartDate()) || date.isAfter(goal.getEndDate())) {
            throw new IllegalArgumentException("Check-in date must be within the goal date range");
        }
        if (date.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Check-in date must not be in the future");
        }
        if (request == null || request.completed() == null) {
            throw new IllegalArgumentException("Completed is required");
        }
        if (request.notes() != null && request.notes().length() > MAXIMUM_NOTES_LENGTH) {
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
    }

    private void rejectDateRangeExcludingCheckIns(Long goalId, LocalDate startDate, LocalDate endDate) {
        boolean excludesCheckIn = goalCheckInRepository
                .findByGoalIdOrderByCheckInDateAscCreatedAtAscIdAsc(goalId)
                .stream()
                .anyMatch(checkIn -> checkIn.getCheckInDate().isBefore(startDate)
                        || checkIn.getCheckInDate().isAfter(endDate));
        if (excludesCheckIn) {
            throw new IllegalArgumentException("Goal date range must include all existing check-ins");
        }
    }

    private void applyValidatedRequest(Goal goal, ValidatedGoalRequest request) {
        goal.setTitle(request.title());
        goal.setStartDate(request.startDate());
        goal.setEndDate(request.endDate());
        goal.setTargetValue(request.targetValue());
        goal.setQualifyingSleepMinutes(request.qualifyingSleepMinutes());
        goal.setCustomUnit(request.customUnit());
        goal.setNotes(request.notes());
    }

    private int calculatePoints(ProgressCalculationResult result) {
        if (!result.progressAvailable() || result.progressPercentage() == null) {
            return 0;
        }
        BigDecimal progressPoints = result.progressPercentage()
                .divideToIntegralValue(BigDecimal.TEN);
        int boundedProgressPoints;
        if (progressPoints.signum() < 0) {
            boundedProgressPoints = 0;
        } else if (progressPoints.compareTo(BigDecimal.TEN) > 0) {
            boundedProgressPoints = 10;
        } else {
            boundedProgressPoints = progressPoints.intValue();
        }
        return boundedProgressPoints + (Boolean.TRUE.equals(result.goalReached()) ? 10 : 0);
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private Goal findGoalForUserOrThrow(Long userProfileId, Long goalId) {
        findUserProfileOrThrow(userProfileId);
        return goalRepository.findByIdAndUserProfileId(goalId, userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Goal not found with id: " + goalId));
    }

    private void requireActive(Goal goal, String message) {
        if (goal.getStatus() != GoalStatus.ACTIVE) {
            throw new IllegalArgumentException(message);
        }
    }

    private String normalizeRequiredTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Goal title is required");
        }
        String trimmed = title.trim();
        if (trimmed.length() > MAXIMUM_TITLE_LENGTH) {
            throw new IllegalArgumentException("Goal title must not exceed 100 characters");
        }
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isDayBased(GoalType goalType) {
        return goalType != GoalType.ACTIVITY_MINUTES;
    }

    private String displayUnit(Goal goal) {
        return switch (goal.getGoalType()) {
            case ACTIVITY_MINUTES -> "minutes";
            case WATER_GOAL_DAYS, SLEEP_TARGET_DAYS, HEALTH_LOGGING_STREAK -> "days";
            case CUSTOM_CHECK_IN -> goal.getCustomUnit() == null ? "check-ins" : goal.getCustomUnit();
        };
    }

    private GoalResponse toGoalResponse(Goal goal) {
        return new GoalResponse(
                goal.getId(),
                goal.getUserProfile().getId(),
                goal.getTitle(),
                goal.getGoalType(),
                goal.getStartDate(),
                goal.getEndDate(),
                goal.getTargetValue(),
                goal.getQualifyingSleepMinutes(),
                goal.getCustomUnit(),
                displayUnit(goal),
                goal.getStatus(),
                goal.getNotes(),
                goal.getCompletedAt(),
                goal.getCancelledAt(),
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }

    private GoalCheckInResponse toGoalCheckInResponse(GoalCheckIn checkIn) {
        Goal goal = checkIn.getGoal();
        return new GoalCheckInResponse(
                checkIn.getId(),
                goal.getId(),
                goal.getUserProfile().getId(),
                checkIn.getCheckInDate(),
                checkIn.isCompleted(),
                checkIn.getNotes(),
                checkIn.getCreatedAt(),
                checkIn.getUpdatedAt()
        );
    }

    private record ValidatedGoalRequest(
            String title,
            GoalType goalType,
            LocalDate startDate,
            LocalDate endDate,
            Long targetValue,
            Integer qualifyingSleepMinutes,
            String customUnit,
            String notes
    ) {
    }
}
