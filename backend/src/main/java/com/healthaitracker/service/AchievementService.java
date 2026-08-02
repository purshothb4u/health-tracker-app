package com.healthaitracker.service;

import com.healthaitracker.dto.AchievementResponse;
import com.healthaitracker.dto.CoupleChallengeProgressResponse;
import com.healthaitracker.entity.AchievementType;
import com.healthaitracker.entity.ChallengeStatus;
import com.healthaitracker.entity.CoupleChallenge;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalStatus;
import com.healthaitracker.entity.GoalType;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.GoalRepository;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AchievementService {

    private final GoalRepository goalRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProgressCalculationService progressCalculationService;
    private final CoupleChallengeParticipantRepository participantRepository;
    private final CoupleChallengeService coupleChallengeService;

    public AchievementService(
            GoalRepository goalRepository,
            UserProfileRepository userProfileRepository,
            ProgressCalculationService progressCalculationService,
            CoupleChallengeParticipantRepository participantRepository,
            CoupleChallengeService coupleChallengeService) {
        this.goalRepository = goalRepository;
        this.userProfileRepository = userProfileRepository;
        this.progressCalculationService = progressCalculationService;
        this.participantRepository = participantRepository;
        this.coupleChallengeService = coupleChallengeService;
    }

    public List<AchievementResponse> getGoalAchievements(Long userProfileId, LocalDate today) {
        if (today == null) {
            throw new IllegalArgumentException("Today is required");
        }
        userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
        List<Goal> goals = goalRepository.findByUserProfileIdOrderByCreatedAtAscIdAsc(userProfileId);
        List<AchievementResponse> achievements = new ArrayList<>();

        goals.stream()
                .filter(goal -> goal.getStatus() == GoalStatus.COMPLETED)
                .min(Comparator
                        .comparing(Goal::getCompletedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                        .thenComparing(Goal::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                        .thenComparing(Goal::getId, Comparator.nullsLast(Long::compareTo)))
                .ifPresent(goal -> achievements.add(new AchievementResponse(
                        AchievementType.FIRST_GOAL_COMPLETED,
                        "First Goal Completed",
                        "You completed your first goal. Keep building on your progress.",
                        userProfileId,
                        goal.getId(),
                        null)));

        goals.stream()
                .filter(goal -> goal.getGoalType() == GoalType.HEALTH_LOGGING_STREAK)
                .filter(goal -> {
                    ProgressCalculationResult progress =
                            progressCalculationService.calculateGoalProgress(goal, today);
                    return progress.progressAvailable()
                            && progress.currentValue() != null
                            && progress.currentValue() >= 7L;
                })
                .min(Comparator
                        .comparing(Goal::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                        .thenComparing(Goal::getId, Comparator.nullsLast(Long::compareTo)))
                .ifPresent(goal -> achievements.add(new AchievementResponse(
                        AchievementType.SEVEN_DAY_CONSISTENCY,
                        "Seven-Day Consistency",
                        "You logged health activity for at least seven consecutive days.",
                        userProfileId,
                        goal.getId(),
                        null)));

        return List.copyOf(achievements);
    }

    public List<AchievementResponse> getCoupleChallengeAchievements(
            Long userProfileId,
            LocalDate today) {
        if (today == null) {
            throw new IllegalArgumentException("Today is required");
        }
        userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
        List<CoupleChallenge> challenges = participantRepository
                .findByUserProfileIdOrderByCreatedAtAscIdAsc(userProfileId)
                .stream()
                .map(CoupleChallengeParticipant::getCoupleChallenge)
                .filter(challenge -> challenge != null && challenge.getId() != null)
                .filter(distinctByChallengeId())
                .toList();
        List<AchievementResponse> achievements = new ArrayList<>();

        challenges.stream()
                .filter(challenge -> effectiveStatus(challenge, today) == ChallengeStatus.COMPLETED)
                .min(Comparator
                        .comparing(this::completionMoment)
                        .thenComparing(
                                CoupleChallenge::getCreatedAt,
                                Comparator.nullsLast(LocalDateTime::compareTo))
                        .thenComparing(
                                CoupleChallenge::getId,
                                Comparator.nullsLast(Long::compareTo)))
                .ifPresent(challenge -> achievements.add(new AchievementResponse(
                        AchievementType.FIRST_COUPLE_CHALLENGE_COMPLETED,
                        "First Couple Challenge Completed",
                        "You completed your first couple challenge together.",
                        userProfileId,
                        null,
                        challenge.getId())));

        challenges.stream()
                .filter(challenge -> {
                    CoupleChallengeProgressResponse progress =
                            coupleChallengeService.getChallengeProgress(challenge.getId(), today);
                    return progress.bothCompleted();
                })
                .min(Comparator
                        .comparing(
                                CoupleChallenge::getCreatedAt,
                                Comparator.nullsLast(LocalDateTime::compareTo))
                        .thenComparing(
                                CoupleChallenge::getId,
                                Comparator.nullsLast(Long::compareTo)))
                .ifPresent(challenge -> achievements.add(new AchievementResponse(
                        AchievementType.BOTH_REACHED_CHALLENGE_TARGET,
                        "Both Reached the Challenge Target",
                        "Both participants reached the shared challenge target.",
                        userProfileId,
                        null,
                        challenge.getId())));

        return List.copyOf(achievements);
    }

    private java.util.function.Predicate<CoupleChallenge> distinctByChallengeId() {
        java.util.Set<Long> seenChallengeIds = new java.util.HashSet<>();
        return challenge -> seenChallengeIds.add(challenge.getId());
    }

    private ChallengeStatus effectiveStatus(CoupleChallenge challenge, LocalDate today) {
        if (challenge.getStatus() == ChallengeStatus.CANCELLED
                || challenge.getStatus() == ChallengeStatus.COMPLETED) {
            return challenge.getStatus();
        }
        if (today.isBefore(challenge.getStartDate())) {
            return ChallengeStatus.UPCOMING;
        }
        if (today.isAfter(challenge.getEndDate())) {
            return ChallengeStatus.COMPLETED;
        }
        return ChallengeStatus.ACTIVE;
    }

    private LocalDateTime completionMoment(CoupleChallenge challenge) {
        return challenge.getCompletedAt() != null
                ? challenge.getCompletedAt()
                : challenge.getEndDate().atTime(LocalTime.MAX);
    }
}
