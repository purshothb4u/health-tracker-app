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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long GOAL_ID = 10L;
    private static final LocalDate START_DATE = LocalDate.of(2026, 1, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 1, 31);
    private static final LocalDate TODAY = LocalDate.of(2026, 1, 15);

    @Mock
    private GoalRepository goalRepository;
    @Mock
    private GoalCheckInRepository goalCheckInRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private ProgressCalculationService progressCalculationService;

    private GoalService service;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        service = new GoalService(
                goalRepository,
                goalCheckInRepository,
                userProfileRepository,
                progressCalculationService);
        profile = new UserProfile();
        profile.setId(USER_ID);
    }

    @Test
    void createsAValidActiveActivityGoalWithNormalizedText() {
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> {
            Goal goal = invocation.getArgument(0);
            goal.setId(GOAL_ID);
            return goal;
        });

        GoalResponse response = service.createGoal(
                USER_ID,
                request("  Walk more  ", GoalType.ACTIVITY_MINUTES, 600L, null, null, "  "));

        assertThat(response.id()).isEqualTo(GOAL_ID);
        assertThat(response.userProfileId()).isEqualTo(USER_ID);
        assertThat(response.title()).isEqualTo("Walk more");
        assertThat(response.goalType()).isEqualTo(GoalType.ACTIVITY_MINUTES);
        assertThat(response.status()).isEqualTo(GoalStatus.ACTIVE);
        assertThat(response.displayUnit()).isEqualTo("minutes");
        assertThat(response.notes()).isNull();
    }

    @Test
    void validatesSleepTargetConfiguration() {
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> service.createGoal(
                USER_ID,
                request("Sleep", GoalType.SLEEP_TARGET_DAYS, 7L, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Qualifying sleep minutes must be between 1 and 1440");
        assertThatThrownBy(() -> service.createGoal(
                USER_ID,
                request("Activity", GoalType.ACTIVITY_MINUTES, 100L, 420, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Qualifying sleep minutes are only available for sleep target goals");
    }

    @Test
    void rejectsInvalidDatesAndTargets() {
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));
        GoalRequest reversed = new GoalRequest(
                "Goal", GoalType.ACTIVITY_MINUTES, END_DATE, START_DATE, 10L, null, null, null);
        GoalRequest excessiveDayTarget = request(
                "Water", GoalType.WATER_GOAL_DAYS, 32L, null, null, null);
        GoalRequest excessiveActivityTarget = request(
                "Activity", GoalType.ACTIVITY_MINUTES, 525_601L, null, null, null);

        assertThatThrownBy(() -> service.createGoal(USER_ID, reversed))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("End date must not be before start date");
        assertThatThrownBy(() -> service.createGoal(USER_ID, excessiveDayTarget))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Target value must not exceed the inclusive goal duration");
        assertThatThrownBy(() -> service.createGoal(USER_ID, excessiveActivityTarget))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Activity target must not exceed 525600 minutes");
    }

    @Test
    void enforcesProfileOwnershipAndImmutableGoalType() {
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));
        when(goalRepository.findByIdAndUserProfileId(GOAL_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getGoal(USER_ID, GOAL_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Goal not found with id: 10");

        Goal goal = goal(GoalType.ACTIVITY_MINUTES, GoalStatus.ACTIVE);
        when(goalRepository.findByIdAndUserProfileId(GOAL_ID, USER_ID)).thenReturn(Optional.of(goal));
        GoalRequest changedType = request(
                "Changed", GoalType.WATER_GOAL_DAYS, 10L, null, null, null);

        assertThatThrownBy(() -> service.updateGoal(USER_ID, GOAL_ID, changedType))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Goal type cannot be changed after creation");
    }

    @Test
    void rejectsEditsToTerminalGoals() {
        Goal goal = goal(GoalType.ACTIVITY_MINUTES, GoalStatus.COMPLETED);
        stubOwnedGoal(goal);

        assertThatThrownBy(() -> service.updateGoal(
                USER_ID,
                GOAL_ID,
                request("Changed", GoalType.ACTIVITY_MINUTES, 100L, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only active goals may be edited");
        verify(goalRepository, never()).save(any());
    }

    @Test
    void completesAndCancelsActiveGoalsWithSeparateLifecycleTimestamps() {
        Goal completed = goal(GoalType.ACTIVITY_MINUTES, GoalStatus.ACTIVE);
        Goal cancelled = goal(GoalType.ACTIVITY_MINUTES, GoalStatus.ACTIVE);
        cancelled.setId(11L);
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));
        when(goalRepository.findByIdAndUserProfileId(GOAL_ID, USER_ID))
                .thenReturn(Optional.of(completed));
        when(goalRepository.findByIdAndUserProfileId(11L, USER_ID))
                .thenReturn(Optional.of(cancelled));
        when(goalRepository.save(any(Goal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GoalResponse completedResponse = service.updateGoalStatus(
                USER_ID, GOAL_ID, new GoalStatusRequest(GoalStatus.COMPLETED));
        GoalResponse cancelledResponse = service.updateGoalStatus(
                USER_ID, 11L, new GoalStatusRequest(GoalStatus.CANCELLED));

        assertThat(completedResponse.status()).isEqualTo(GoalStatus.COMPLETED);
        assertThat(completedResponse.completedAt()).isNotNull();
        assertThat(completedResponse.cancelledAt()).isNull();
        assertThat(cancelledResponse.status()).isEqualTo(GoalStatus.CANCELLED);
        assertThat(cancelledResponse.cancelledAt()).isNotNull();
        assertThat(cancelledResponse.completedAt()).isNull();
    }

    @Test
    void upsertsACustomCheckInWhilePreservingIdentityAndCreationTime() {
        Goal goal = goal(GoalType.CUSTOM_CHECK_IN, GoalStatus.ACTIVE);
        GoalCheckIn existing = new GoalCheckIn();
        existing.setId(50L);
        existing.setGoal(goal);
        existing.setCheckInDate(TODAY);
        existing.setCompleted(false);
        existing.setCreatedAt(LocalDateTime.of(2026, 1, 15, 8, 0));
        stubOwnedGoal(goal);
        when(goalCheckInRepository.findByGoalIdAndCheckInDate(GOAL_ID, TODAY))
                .thenReturn(Optional.of(existing));
        when(goalCheckInRepository.save(existing)).thenReturn(existing);

        GoalCheckInResponse response = service.upsertGoalCheckIn(
                USER_ID,
                GOAL_ID,
                TODAY,
                new ProgressCheckInRequest(true, "  done  "));

        assertThat(response.id()).isEqualTo(50L);
        assertThat(response.createdAt()).isEqualTo(LocalDateTime.of(2026, 1, 15, 8, 0));
        assertThat(response.completed()).isTrue();
        assertThat(response.notes()).isEqualTo("done");
    }

    @Test
    void rejectsCheckInsForNonCustomGoals() {
        Goal goal = goal(GoalType.ACTIVITY_MINUTES, GoalStatus.ACTIVE);
        stubOwnedGoal(goal);

        assertThatThrownBy(() -> service.upsertGoalCheckIn(
                USER_ID, GOAL_ID, TODAY, new ProgressCheckInRequest(true, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Check-ins are only available for custom check-in goals");
    }

    @Test
    void rejectsDateRangeUpdatesThatWouldExcludeAnExistingCheckIn() {
        Goal goal = goal(GoalType.CUSTOM_CHECK_IN, GoalStatus.ACTIVE);
        GoalCheckIn checkIn = new GoalCheckIn();
        checkIn.setCheckInDate(START_DATE);
        stubOwnedGoal(goal);
        when(goalCheckInRepository.findByGoalIdOrderByCheckInDateAscCreatedAtAscIdAsc(GOAL_ID))
                .thenReturn(List.of(checkIn));
        GoalRequest narrowed = new GoalRequest(
                "Custom", GoalType.CUSTOM_CHECK_IN, START_DATE.plusDays(1), END_DATE,
                5L, null, "sessions", null);

        assertThatThrownBy(() -> service.updateGoal(USER_ID, GOAL_ID, narrowed))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Goal date range must include all existing check-ins");
    }

    @Test
    void deletesCheckInsBeforeDeletingTheOwnedGoal() {
        Goal goal = goal(GoalType.CUSTOM_CHECK_IN, GoalStatus.CANCELLED);
        stubOwnedGoal(goal);

        service.deleteGoal(USER_ID, GOAL_ID);

        InOrder order = inOrder(goalCheckInRepository, goalRepository);
        order.verify(goalCheckInRepository).deleteByGoalId(GOAL_ID);
        order.verify(goalRepository).delete(goal);
    }

    @Test
    void derivesProgressPointsAndTargetBonusWithoutPersistingThem() {
        Goal goal = goal(GoalType.ACTIVITY_MINUTES, GoalStatus.ACTIVE);
        stubOwnedGoal(goal);
        when(progressCalculationService.calculateGoalProgress(goal, TODAY))
                .thenReturn(new ProgressCalculationResult(
                        120L, 100L, new BigDecimal("120.00"), true, true, "minutes", null));

        GoalProgressResponse response = service.getGoalProgress(USER_ID, GOAL_ID, TODAY);

        assertThat(response.points()).isEqualTo(20);
        assertThat(response.progressPercentage()).isEqualByComparingTo("120.00");
        assertThat(response.goalReached()).isTrue();
    }

    @Test
    void returnsZeroPointsWhenProgressIsUnavailable() {
        Goal goal = goal(GoalType.WATER_GOAL_DAYS, GoalStatus.ACTIVE);
        stubOwnedGoal(goal);
        when(progressCalculationService.calculateGoalProgress(goal, TODAY))
                .thenReturn(new ProgressCalculationResult(
                        null, 10L, null, null, false, "days", "Configure a water goal"));

        GoalProgressResponse response = service.getGoalProgress(USER_ID, GOAL_ID, TODAY);

        assertThat(response.points()).isZero();
        assertThat(response.currentValue()).isNull();
        assertThat(response.progressAvailable()).isFalse();
    }

    private void stubOwnedGoal(Goal goal) {
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));
        when(goalRepository.findByIdAndUserProfileId(GOAL_ID, USER_ID)).thenReturn(Optional.of(goal));
    }

    private Goal goal(GoalType type, GoalStatus status) {
        Goal goal = new Goal();
        goal.setId(GOAL_ID);
        goal.setUserProfile(profile);
        goal.setTitle("Goal");
        goal.setGoalType(type);
        goal.setStartDate(START_DATE);
        goal.setEndDate(END_DATE);
        goal.setTargetValue(type == GoalType.ACTIVITY_MINUTES ? 100L : 10L);
        goal.setCustomUnit(type == GoalType.CUSTOM_CHECK_IN ? "sessions" : null);
        goal.setStatus(status);
        goal.setCreatedAt(LocalDateTime.of(2026, 1, 1, 8, 0));
        goal.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 8, 0));
        return goal;
    }

    private GoalRequest request(
            String title,
            GoalType type,
            Long target,
            Integer sleepMinutes,
            String customUnit,
            String notes) {
        return new GoalRequest(
                title,
                type,
                START_DATE,
                END_DATE,
                target,
                sleepMinutes,
                customUnit,
                notes);
    }
}
