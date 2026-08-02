package com.healthaitracker.service;

import com.healthaitracker.entity.ActivityEntry;
import com.healthaitracker.entity.ChallengeCheckIn;
import com.healthaitracker.entity.ChallengeType;
import com.healthaitracker.entity.CoupleChallenge;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalCheckIn;
import com.healthaitracker.entity.GoalType;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgressCalculationServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 1);
    private static final LocalDate START_DATE = TODAY.minusDays(4);
    private static final Long PROFILE_ID = 1L;

    @Mock
    private ActivityEntryRepository activityEntryRepository;
    @Mock
    private WaterEntryRepository waterEntryRepository;
    @Mock
    private WaterGoalRepository waterGoalRepository;
    @Mock
    private SleepEntryRepository sleepEntryRepository;
    @Mock
    private HealthMetricRepository healthMetricRepository;
    @Mock
    private FoodEntryRepository foodEntryRepository;
    @Mock
    private GoalCheckInRepository goalCheckInRepository;
    @Mock
    private ChallengeCheckInRepository challengeCheckInRepository;

    private ProgressCalculationService service;

    @BeforeEach
    void setUp() {
        service = new ProgressCalculationService(
                activityEntryRepository,
                waterEntryRepository,
                waterGoalRepository,
                sleepEntryRepository,
                healthMetricRepository,
                foodEntryRepository,
                goalCheckInRepository,
                challengeCheckInRepository);
    }

    @Test
    void returnsAvailableZeroProgressBeforeGoalStartWithoutQueryingTrackingData() {
        Goal goal = createGoal(GoalType.ACTIVITY_MINUTES, TODAY.plusDays(1), TODAY.plusDays(5), 100L);

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 0L, "0.00", false, "minutes");
        verifyNoInteractions(
                activityEntryRepository,
                waterEntryRepository,
                waterGoalRepository,
                sleepEntryRepository,
                healthMetricRepository,
                foodEntryRepository,
                goalCheckInRepository,
                challengeCheckInRepository);
    }

    @Test
    void sumsActivityMinutesAcrossTheInclusiveEvaluationWindow() {
        Goal goal = createGoal(GoalType.ACTIVITY_MINUTES, START_DATE, TODAY.plusDays(3), 100L);
        when(activityEntryRepository
                .findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, START_DATE, TODAY))
                .thenReturn(List.of(
                        activityEntry(START_DATE, 30),
                        activityEntry(TODAY, 45)));

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 75L, "75.00", false, "minutes");
    }

    @Test
    void countsDaysWhoseLongWaterTotalMeetsTheCurrentGoal() {
        Goal goal = createGoal(GoalType.WATER_GOAL_DAYS, START_DATE, TODAY, 3L);
        WaterGoal waterGoal = new WaterGoal();
        waterGoal.setDailyGoalMl(1_000);
        when(waterGoalRepository.findByUserProfileId(PROFILE_ID)).thenReturn(Optional.of(waterGoal));
        when(waterEntryRepository
                .findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, START_DATE, TODAY))
                .thenReturn(List.of(
                        waterEntry(START_DATE, 400),
                        waterEntry(START_DATE, 600),
                        waterEntry(START_DATE.plusDays(1), 999),
                        waterEntry(TODAY, 1_200)));

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 2L, "66.67", false, "days");
    }

    @Test
    void returnsUnavailableWaterProgressWhenTheProfileHasNoGoal() {
        Goal goal = createGoal(GoalType.WATER_GOAL_DAYS, START_DATE, TODAY, 3L);
        when(waterGoalRepository.findByUserProfileId(PROFILE_ID)).thenReturn(Optional.empty());

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertThat(result.currentValue()).isNull();
        assertThat(result.targetValue()).isEqualTo(3L);
        assertThat(result.progressPercentage()).isNull();
        assertThat(result.goalReached()).isNull();
        assertThat(result.progressAvailable()).isFalse();
        assertThat(result.displayUnit()).isEqualTo("days");
        assertThat(result.message()).isEqualTo("Configure a water goal to calculate progress.");
        verifyNoInteractions(waterEntryRepository);
    }

    @Test
    void groupsSleepDurationsBySleepDateAndCountsQualifyingDays() {
        Goal goal = createGoal(GoalType.SLEEP_TARGET_DAYS, START_DATE, TODAY, 3L);
        goal.setQualifyingSleepMinutes(420);
        when(sleepEntryRepository
                .findByUserProfileIdAndSleepDateBetweenOrderBySleepDateAscStartDateTimeAscCreatedAtAscIdAsc(
                        PROFILE_ID, START_DATE, TODAY))
                .thenReturn(List.of(
                        sleepEntry(START_DATE, 360),
                        sleepEntry(START_DATE, 60),
                        sleepEntry(START_DATE.plusDays(1), 419),
                        sleepEntry(TODAY, 480)));

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 2L, "66.67", false, "days");
    }

    @Test
    void findsTheLongestHealthLoggingStreakAcrossAllSupportedDomains() {
        LocalDate first = START_DATE;
        Goal goal = createGoal(GoalType.HEALTH_LOGGING_STREAK, first, TODAY, 4L);
        when(healthMetricRepository.findByUserProfileIdAndMetricDateBetweenOrderByMetricDateAsc(
                PROFILE_ID, first, TODAY)).thenReturn(List.of(healthMetric(first)));
        when(foodEntryRepository
                .findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, first, TODAY)).thenReturn(List.of(foodEntry(first.plusDays(1))));
        when(waterEntryRepository
                .findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, first, TODAY)).thenReturn(List.of(waterEntry(first.plusDays(2), 250)));
        when(activityEntryRepository
                .findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, first, TODAY)).thenReturn(List.of(activityEntry(TODAY, 10)));
        when(sleepEntryRepository
                .findByUserProfileIdAndSleepDateBetweenOrderBySleepDateAscStartDateTimeAscCreatedAtAscIdAsc(
                        PROFILE_ID, first, TODAY)).thenReturn(List.of(
                        sleepEntry(first.plusDays(2), 60),
                        sleepEntry(TODAY, 60)));

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 3L, "75.00", false, "days");
    }

    @Test
    void countsOnlyCompletedGoalCheckInsWithinTheWindow() {
        Goal goal = createGoal(GoalType.CUSTOM_CHECK_IN, START_DATE, TODAY, 3L);
        goal.setId(10L);
        when(goalCheckInRepository
                .findByGoalIdAndCheckInDateBetweenOrderByCheckInDateAscCreatedAtAscIdAsc(
                        10L, START_DATE, TODAY))
                .thenReturn(List.of(
                        goalCheckIn(goal, START_DATE, true),
                        goalCheckIn(goal, START_DATE.plusDays(1), false),
                        goalCheckIn(goal, TODAY, true)));

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 2L, "66.67", false, "check-ins");
    }

    @Test
    void calculatesCustomChallengeProgressForTheRequestedParticipantOnly() {
        CoupleChallenge challenge = createChallenge(ChallengeType.CUSTOM_CHECK_IN, 2L);
        CoupleChallengeParticipant husband = participant(101L, challenge, 1L);
        CoupleChallengeParticipant wife = participant(102L, challenge, 2L);
        when(challengeCheckInRepository
                .findByParticipantIdAndCheckInDateBetweenOrderByCheckInDateAscCreatedAtAscIdAsc(
                        101L, START_DATE, TODAY))
                .thenReturn(List.of(challengeCheckIn(husband, START_DATE, true)));
        when(challengeCheckInRepository
                .findByParticipantIdAndCheckInDateBetweenOrderByCheckInDateAscCreatedAtAscIdAsc(
                        102L, START_DATE, TODAY))
                .thenReturn(List.of());

        ProgressCalculationResult husbandResult =
                service.calculateChallengeProgress(challenge, husband, TODAY);
        ProgressCalculationResult wifeResult =
                service.calculateChallengeProgress(challenge, wife, TODAY);

        assertAvailableResult(husbandResult, 1L, "50.00", false, "check-ins");
        assertAvailableResult(wifeResult, 0L, "0.00", false, "check-ins");
    }

    @Test
    void preservesProgressAboveOneHundredPercentAndMarksTheTargetReached() {
        Goal goal = createGoal(GoalType.ACTIVITY_MINUTES, START_DATE, TODAY, 100L);
        when(activityEntryRepository
                .findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, START_DATE, TODAY))
                .thenReturn(List.of(activityEntry(START_DATE, 120)));

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 120L, "120.00", true, "minutes");
    }

    @Test
    void defensivelyExcludesRepositoryResultsOutsideTheEvaluationWindow() {
        Goal goal = createGoal(GoalType.ACTIVITY_MINUTES, START_DATE, TODAY, 100L);
        when(activityEntryRepository
                .findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, START_DATE, TODAY))
                .thenReturn(List.of(
                        activityEntry(START_DATE, 50),
                        activityEntry(START_DATE.minusDays(1), 100),
                        activityEntry(TODAY.plusDays(1), 100)));

        ProgressCalculationResult result = service.calculateGoalProgress(goal, TODAY);

        assertAvailableResult(result, 50L, "50.00", false, "minutes");
        verify(activityEntryRepository)
                .findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
                        PROFILE_ID, START_DATE, TODAY);
    }

    private Goal createGoal(GoalType type, LocalDate startDate, LocalDate endDate, Long targetValue) {
        Goal goal = new Goal();
        goal.setUserProfile(profile(PROFILE_ID));
        goal.setGoalType(type);
        goal.setStartDate(startDate);
        goal.setEndDate(endDate);
        goal.setTargetValue(targetValue);
        return goal;
    }

    private CoupleChallenge createChallenge(ChallengeType type, Long targetValue) {
        CoupleChallenge challenge = new CoupleChallenge();
        challenge.setId(50L);
        challenge.setChallengeType(type);
        challenge.setStartDate(START_DATE);
        challenge.setEndDate(TODAY);
        challenge.setTargetValue(targetValue);
        return challenge;
    }

    private CoupleChallengeParticipant participant(
            Long id,
            CoupleChallenge challenge,
            Long profileId) {
        CoupleChallengeParticipant participant = new CoupleChallengeParticipant();
        participant.setId(id);
        participant.setCoupleChallenge(challenge);
        participant.setUserProfile(profile(profileId));
        return participant;
    }

    private UserProfile profile(Long id) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        return profile;
    }

    private ActivityEntry activityEntry(LocalDate date, int minutes) {
        ActivityEntry entry = new ActivityEntry();
        entry.setActivityDate(date);
        entry.setDurationMinutes(minutes);
        return entry;
    }

    private WaterEntry waterEntry(LocalDate date, int amountMl) {
        WaterEntry entry = new WaterEntry();
        entry.setEntryDate(date);
        entry.setAmountMl(amountMl);
        return entry;
    }

    private SleepEntry sleepEntry(LocalDate sleepDate, int durationMinutes) {
        SleepEntry entry = new SleepEntry();
        entry.setSleepDate(sleepDate);
        LocalDateTime start = sleepDate.atStartOfDay();
        entry.setStartDateTime(start);
        entry.setEndDateTime(start.plusMinutes(durationMinutes));
        return entry;
    }

    private HealthMetric healthMetric(LocalDate date) {
        HealthMetric metric = new HealthMetric();
        metric.setMetricDate(date);
        return metric;
    }

    private FoodEntry foodEntry(LocalDate date) {
        FoodEntry entry = new FoodEntry();
        entry.setEntryDate(date);
        return entry;
    }

    private GoalCheckIn goalCheckIn(Goal goal, LocalDate date, boolean completed) {
        GoalCheckIn checkIn = new GoalCheckIn();
        checkIn.setGoal(goal);
        checkIn.setCheckInDate(date);
        checkIn.setCompleted(completed);
        return checkIn;
    }

    private ChallengeCheckIn challengeCheckIn(
            CoupleChallengeParticipant participant,
            LocalDate date,
            boolean completed) {
        ChallengeCheckIn checkIn = new ChallengeCheckIn();
        checkIn.setParticipant(participant);
        checkIn.setCheckInDate(date);
        checkIn.setCompleted(completed);
        return checkIn;
    }

    private void assertAvailableResult(
            ProgressCalculationResult result,
            Long currentValue,
            String percentage,
            boolean reached,
            String displayUnit) {
        assertThat(result.currentValue()).isEqualTo(currentValue);
        assertThat(result.targetValue()).isNotNull();
        assertThat(result.progressPercentage()).isEqualByComparingTo(percentage);
        assertThat(result.goalReached()).isEqualTo(reached);
        assertThat(result.progressAvailable()).isTrue();
        assertThat(result.displayUnit()).isEqualTo(displayUnit);
        assertThat(result.message()).isNull();
    }
}
