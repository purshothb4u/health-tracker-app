package com.healthaitracker.service;

import com.healthaitracker.dto.AchievementResponse;
import com.healthaitracker.dto.CoupleChallengeProgressResponse;
import com.healthaitracker.entity.AchievementType;
import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalStatus;
import com.healthaitracker.entity.GoalType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.entity.ChallengeStatus;
import com.healthaitracker.entity.ChallengeType;
import com.healthaitracker.entity.CoupleChallenge;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.GoalRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    private static final Long USER_ID = 1L;
    private static final LocalDate TODAY = LocalDate.of(2026, 1, 15);

    @Mock
    private GoalRepository goalRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private ProgressCalculationService progressCalculationService;
    @Mock
    private CoupleChallengeParticipantRepository participantRepository;
    @Mock
    private CoupleChallengeService coupleChallengeService;

    private AchievementService service;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        service = new AchievementService(
                goalRepository,
                userProfileRepository,
                progressCalculationService,
                participantRepository,
                coupleChallengeService);
        profile = new UserProfile();
        profile.setId(USER_ID);
        when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));
    }

    @Test
    void returnsFirstGoalCompletedOnceAndReferencesTheEarliestCompletion() {
        Goal later = goal(2L, GoalType.ACTIVITY_MINUTES, GoalStatus.COMPLETED, 10);
        Goal earliest = goal(1L, GoalType.WATER_GOAL_DAYS, GoalStatus.COMPLETED, 5);
        when(goalRepository.findByUserProfileIdOrderByCreatedAtAscIdAsc(USER_ID))
                .thenReturn(List.of(later, earliest));

        List<AchievementResponse> achievements = service.getGoalAchievements(USER_ID, TODAY);

        assertThat(achievements).hasSize(1);
        assertThat(achievements.getFirst().achievementType())
                .isEqualTo(AchievementType.FIRST_GOAL_COMPLETED);
        assertThat(achievements.getFirst().goalId()).isEqualTo(1L);
        assertThat(achievements.getFirst().challengeId()).isNull();
    }

    @Test
    void returnsSevenDayConsistencyOnceAndReferencesTheEarliestQualifyingGoal() {
        Goal earliest = goal(1L, GoalType.HEALTH_LOGGING_STREAK, GoalStatus.ACTIVE, null);
        Goal later = goal(2L, GoalType.HEALTH_LOGGING_STREAK, GoalStatus.ACTIVE, null);
        later.setCreatedAt(earliest.getCreatedAt().plusDays(1));
        when(goalRepository.findByUserProfileIdOrderByCreatedAtAscIdAsc(USER_ID))
                .thenReturn(List.of(earliest, later));
        when(progressCalculationService.calculateGoalProgress(earliest, TODAY))
                .thenReturn(progress(7L));
        when(progressCalculationService.calculateGoalProgress(later, TODAY))
                .thenReturn(progress(12L));

        List<AchievementResponse> achievements = service.getGoalAchievements(USER_ID, TODAY);

        assertThat(achievements).hasSize(1);
        assertThat(achievements.getFirst().achievementType())
                .isEqualTo(AchievementType.SEVEN_DAY_CONSISTENCY);
        assertThat(achievements.getFirst().goalId()).isEqualTo(1L);
    }

    @Test
    void returnsFirstCompletedCoupleChallengeUsingEffectiveStatus() {
        CoupleChallenge later = challenge(20L, LocalDate.of(2026, 1, 10));
        CoupleChallenge earliest = challenge(10L, LocalDate.of(2026, 1, 5));
        when(participantRepository.findByUserProfileIdOrderByCreatedAtAscIdAsc(USER_ID))
                .thenReturn(List.of(participant(later), participant(earliest)));
        when(coupleChallengeService.getChallengeProgress(20L, TODAY))
                .thenReturn(challengeProgress(20L, false));
        when(coupleChallengeService.getChallengeProgress(10L, TODAY))
                .thenReturn(challengeProgress(10L, false));

        List<AchievementResponse> achievements =
                service.getCoupleChallengeAchievements(USER_ID, TODAY);

        assertThat(achievements).hasSize(1);
        assertThat(achievements.getFirst().achievementType())
                .isEqualTo(AchievementType.FIRST_COUPLE_CHALLENGE_COMPLETED);
        assertThat(achievements.getFirst().challengeId()).isEqualTo(10L);
        assertThat(achievements.getFirst().userProfileId()).isEqualTo(USER_ID);
    }

    @Test
    void returnsBothReachedTargetForTheEarliestQualifyingChallenge() {
        CoupleChallenge earliest = challenge(10L, TODAY.plusDays(5));
        CoupleChallenge later = challenge(20L, TODAY.plusDays(5));
        later.setCreatedAt(earliest.getCreatedAt().plusDays(1));
        when(participantRepository.findByUserProfileIdOrderByCreatedAtAscIdAsc(USER_ID))
                .thenReturn(List.of(participant(earliest), participant(later)));
        when(coupleChallengeService.getChallengeProgress(10L, TODAY))
                .thenReturn(challengeProgress(10L, true));
        when(coupleChallengeService.getChallengeProgress(20L, TODAY))
                .thenReturn(challengeProgress(20L, true));

        List<AchievementResponse> achievements =
                service.getCoupleChallengeAchievements(USER_ID, TODAY);

        assertThat(achievements).hasSize(1);
        assertThat(achievements.getFirst().achievementType())
                .isEqualTo(AchievementType.BOTH_REACHED_CHALLENGE_TARGET);
        assertThat(achievements.getFirst().challengeId()).isEqualTo(10L);
    }

    private Goal goal(Long id, GoalType type, GoalStatus status, Integer completedDay) {
        Goal goal = new Goal();
        goal.setId(id);
        goal.setUserProfile(profile);
        goal.setGoalType(type);
        goal.setStatus(status);
        goal.setStartDate(LocalDate.of(2026, 1, 1));
        goal.setEndDate(LocalDate.of(2026, 1, 31));
        goal.setTargetValue(7L);
        goal.setCreatedAt(LocalDateTime.of(2026, 1, 1, 8, 0));
        if (completedDay != null) {
            goal.setCompletedAt(LocalDateTime.of(2026, 1, completedDay, 8, 0));
        }
        return goal;
    }

    private ProgressCalculationResult progress(Long currentValue) {
        return new ProgressCalculationResult(
                currentValue,
                7L,
                new BigDecimal("100.00"),
                true,
                true,
                "days",
                null);
    }

    private CoupleChallenge challenge(Long id, LocalDate endDate) {
        CoupleChallenge challenge = new CoupleChallenge();
        challenge.setId(id);
        challenge.setChallengeType(ChallengeType.ACTIVITY_MINUTES);
        challenge.setStatus(ChallengeStatus.ACTIVE);
        challenge.setStartDate(LocalDate.of(2026, 1, 1));
        challenge.setEndDate(endDate);
        challenge.setTargetValue(100L);
        challenge.setCreatedAt(LocalDateTime.of(2026, 1, 1, 8, 0));
        return challenge;
    }

    private CoupleChallengeParticipant participant(CoupleChallenge challenge) {
        CoupleChallengeParticipant participant = new CoupleChallengeParticipant();
        participant.setCoupleChallenge(challenge);
        participant.setUserProfile(profile);
        return participant;
    }

    private CoupleChallengeProgressResponse challengeProgress(Long challengeId, boolean bothCompleted) {
        return new CoupleChallengeProgressResponse(
                challengeId,
                ChallengeStatus.ACTIVE,
                List.of(),
                null,
                true,
                bothCompleted,
                "It is a tie",
                "Both are making progress.");
    }
}
