package com.healthaitracker.service;

import com.healthaitracker.dto.ChallengeCheckInResponse;
import com.healthaitracker.dto.ChallengeStatusRequest;
import com.healthaitracker.dto.CoupleChallengeParticipantResponse;
import com.healthaitracker.dto.CoupleChallengeProgressResponse;
import com.healthaitracker.dto.CoupleChallengeRequest;
import com.healthaitracker.dto.CoupleChallengeResponse;
import com.healthaitracker.dto.ParticipantProgressResponse;
import com.healthaitracker.dto.ProgressCheckInRequest;
import com.healthaitracker.entity.ChallengeCheckIn;
import com.healthaitracker.entity.ChallengeStatus;
import com.healthaitracker.entity.ChallengeType;
import com.healthaitracker.entity.CoupleChallenge;
import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.ChallengeCheckInRepository;
import com.healthaitracker.repository.CoupleChallengeParticipantRepository;
import com.healthaitracker.repository.CoupleChallengeRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class CoupleChallengeService {

    private static final int MAXIMUM_TITLE_LENGTH = 100;
    private static final int MAXIMUM_NOTES_LENGTH = 500;
    private static final int MAXIMUM_CUSTOM_UNIT_LENGTH = 30;
    private static final long MAXIMUM_CHALLENGE_DAYS = 365L;
    private static final long MAXIMUM_ACTIVITY_MINUTES = 525_600L;
    private static final int MAXIMUM_SLEEP_MINUTES = 1_440;

    private final CoupleChallengeRepository challengeRepository;
    private final CoupleChallengeParticipantRepository participantRepository;
    private final ChallengeCheckInRepository checkInRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProgressCalculationService progressCalculationService;

    public CoupleChallengeService(
            CoupleChallengeRepository challengeRepository,
            CoupleChallengeParticipantRepository participantRepository,
            ChallengeCheckInRepository checkInRepository,
            UserProfileRepository userProfileRepository,
            ProgressCalculationService progressCalculationService) {
        this.challengeRepository = challengeRepository;
        this.participantRepository = participantRepository;
        this.checkInRepository = checkInRepository;
        this.userProfileRepository = userProfileRepository;
        this.progressCalculationService = progressCalculationService;
    }

    @Transactional
    public CoupleChallengeResponse createChallenge(CoupleChallengeRequest request, LocalDate today) {
        validateToday(today);
        ValidatedChallengeRequest validated = validateChallengeRequest(request);
        List<UserProfile> profiles = findParticipantProfiles(validated.participantUserProfileIds());

        CoupleChallenge challenge = new CoupleChallenge();
        challenge.setChallengeType(validated.challengeType());
        challenge.setStatus(today.isBefore(validated.startDate())
                ? ChallengeStatus.UPCOMING
                : ChallengeStatus.ACTIVE);
        applyValidatedRequest(challenge, validated);
        challenge = challengeRepository.save(challenge);

        List<CoupleChallengeParticipant> participants = new ArrayList<>();
        for (UserProfile profile : profiles) {
            CoupleChallengeParticipant participant = new CoupleChallengeParticipant();
            participant.setCoupleChallenge(challenge);
            participant.setUserProfile(profile);
            participants.add(participant);
        }
        List<CoupleChallengeParticipant> savedParticipants =
                participantRepository.saveAll(participants);
        return toChallengeResponse(challenge, savedParticipants, today);
    }

    public List<CoupleChallengeResponse> getChallenges(
            ChallengeStatus optionalStatus,
            LocalDate today) {
        validateToday(today);
        return challengeRepository.findAllByOrderByCreatedAtAscIdAsc().stream()
                .filter(challenge -> optionalStatus == null
                        || effectiveStatus(challenge, today) == optionalStatus)
                .map(challenge -> toChallengeResponse(
                        challenge,
                        findParticipants(challenge.getId()),
                        today))
                .toList();
    }

    public CoupleChallengeResponse getChallenge(Long challengeId, LocalDate today) {
        validateToday(today);
        CoupleChallenge challenge = findChallengeOrThrow(challengeId);
        return toChallengeResponse(challenge, findParticipants(challengeId), today);
    }

    @Transactional
    public CoupleChallengeResponse updateChallenge(
            Long challengeId,
            CoupleChallengeRequest request,
            LocalDate today) {
        validateToday(today);
        CoupleChallenge challenge = findChallengeOrThrow(challengeId);
        requireNonTerminal(challenge, today, "Completed and cancelled challenges cannot be edited");
        ValidatedChallengeRequest validated = validateChallengeRequest(request);
        if (challenge.getChallengeType() != validated.challengeType()) {
            throw new IllegalArgumentException("Challenge type cannot be changed after creation");
        }
        List<CoupleChallengeParticipant> participants = findParticipants(challengeId);
        validateImmutableParticipants(participants, validated.participantUserProfileIds());
        findParticipantProfiles(validated.participantUserProfileIds());
        rejectDateRangeExcludingCheckIns(
                challengeId,
                validated.startDate(),
                validated.endDate());
        applyValidatedRequest(challenge, validated);
        return toChallengeResponse(challengeRepository.save(challenge), participants, today);
    }

    @Transactional
    public CoupleChallengeResponse updateChallengeStatus(
            Long challengeId,
            ChallengeStatusRequest request,
            LocalDate today) {
        validateToday(today);
        CoupleChallenge challenge = findChallengeOrThrow(challengeId);
        if (request == null || request.status() == null) {
            throw new IllegalArgumentException("Challenge status is required");
        }
        ChallengeStatus currentStatus = effectiveStatus(challenge, today);
        if (currentStatus == ChallengeStatus.COMPLETED
                || currentStatus == ChallengeStatus.CANCELLED) {
            throw new IllegalArgumentException("Completed and cancelled challenges are terminal");
        }

        LocalDateTime now = LocalDateTime.now();
        if (request.status() == ChallengeStatus.CANCELLED) {
            challenge.setStatus(ChallengeStatus.CANCELLED);
            challenge.setCancelledAt(now);
            challenge.setCompletedAt(null);
        } else if (currentStatus == ChallengeStatus.ACTIVE
                && request.status() == ChallengeStatus.COMPLETED) {
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challenge.setCompletedAt(now);
            challenge.setCancelledAt(null);
        } else {
            throw new IllegalArgumentException("The requested challenge status transition is not allowed");
        }
        return toChallengeResponse(
                challengeRepository.save(challenge),
                findParticipants(challengeId),
                today);
    }

    @Transactional
    public void deleteChallenge(Long challengeId) {
        CoupleChallenge challenge = findChallengeOrThrow(challengeId);
        checkInRepository.deleteByParticipantCoupleChallengeId(challengeId);
        participantRepository.deleteByCoupleChallengeId(challengeId);
        challengeRepository.delete(challenge);
    }

    public CoupleChallengeProgressResponse getChallengeProgress(
            Long challengeId,
            LocalDate today) {
        validateToday(today);
        CoupleChallenge challenge = findChallengeOrThrow(challengeId);
        List<CoupleChallengeParticipant> participants = findParticipants(challengeId);
        if (participants.size() != 2) {
            throw new IllegalStateException("A couple challenge must have exactly two participants");
        }

        List<ParticipantCalculation> calculations = participants.stream()
                .map(participant -> new ParticipantCalculation(
                        participant,
                        progressCalculationService.calculateChallengeProgress(
                                challenge,
                                participant,
                                today)))
                .toList();
        boolean progressAvailable = calculations.stream()
                .allMatch(calculation -> calculation.result().progressAvailable());
        boolean bothCompleted = progressAvailable && calculations.stream()
                .allMatch(calculation -> Boolean.TRUE.equals(calculation.result().goalReached()));

        List<ParticipantProgressResponse> participantProgress = calculations.stream()
                .map(calculation -> toParticipantProgress(calculation, bothCompleted))
                .toList();
        LeaderResult leader = determineLeader(calculations, progressAvailable);
        ChallengeStatus status = effectiveStatus(challenge, today);
        OutcomeMessages messages = determineOutcome(
                status,
                calculations,
                progressAvailable,
                bothCompleted,
                leader.tie());

        return new CoupleChallengeProgressResponse(
                challengeId,
                status,
                participantProgress,
                leader.userProfileId(),
                leader.tie(),
                bothCompleted,
                messages.outcome(),
                messages.supportiveMessage()
        );
    }

    @Transactional
    public ChallengeCheckInResponse upsertChallengeCheckIn(
            Long challengeId,
            Long participantUserProfileId,
            LocalDate date,
            ProgressCheckInRequest request,
            LocalDate today) {
        validateToday(today);
        CoupleChallenge challenge = findChallengeOrThrow(challengeId);
        requireNonTerminal(
                challenge,
                today,
                "Completed and cancelled challenges cannot receive check-ins");
        if (challenge.getChallengeType() != ChallengeType.CUSTOM_CHECK_IN) {
            throw new IllegalArgumentException(
                    "Check-ins are only available for custom check-in challenges");
        }
        CoupleChallengeParticipant participant = participantRepository
                .findByCoupleChallengeIdAndUserProfileId(challengeId, participantUserProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Challenge participant not found"));
        validateCheckIn(date, request, challenge, today);

        ChallengeCheckIn checkIn = checkInRepository
                .findByParticipantIdAndCheckInDate(participant.getId(), date)
                .orElseGet(() -> {
                    ChallengeCheckIn newCheckIn = new ChallengeCheckIn();
                    newCheckIn.setParticipant(participant);
                    newCheckIn.setCheckInDate(date);
                    return newCheckIn;
                });
        checkIn.setCompleted(request.completed());
        checkIn.setNotes(normalizeOptional(request.notes()));
        return toCheckInResponse(checkInRepository.save(checkIn));
    }

    private ValidatedChallengeRequest validateChallengeRequest(CoupleChallengeRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Couple challenge request is required");
        }
        String title = normalizeRequiredTitle(request.title());
        if (request.challengeType() == null) {
            throw new IllegalArgumentException("Challenge type is required");
        }
        if (request.startDate() == null || request.endDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("End date must not be before start date");
        }
        long inclusiveDays = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1L;
        if (inclusiveDays > MAXIMUM_CHALLENGE_DAYS) {
            throw new IllegalArgumentException("Challenge duration must not exceed 365 days");
        }
        if (request.targetValue() == null || request.targetValue() <= 0L) {
            throw new IllegalArgumentException("Target value must be positive");
        }
        if (isDayBased(request.challengeType()) && request.targetValue() > inclusiveDays) {
            throw new IllegalArgumentException(
                    "Target value must not exceed the inclusive challenge duration");
        }
        if (request.challengeType() == ChallengeType.ACTIVITY_MINUTES
                && request.targetValue() > MAXIMUM_ACTIVITY_MINUTES) {
            throw new IllegalArgumentException("Activity target must not exceed 525600 minutes");
        }
        validateTypeSpecificConfiguration(request);
        List<Long> participantIds = validateParticipantIds(request.participantUserProfileIds());
        if (request.notes() != null && request.notes().length() > MAXIMUM_NOTES_LENGTH) {
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
        String customUnit = normalizeOptional(request.customUnit());
        if (customUnit != null && customUnit.length() > MAXIMUM_CUSTOM_UNIT_LENGTH) {
            throw new IllegalArgumentException("Custom unit must not exceed 30 characters");
        }
        return new ValidatedChallengeRequest(
                title,
                request.challengeType(),
                request.startDate(),
                request.endDate(),
                request.targetValue(),
                request.qualifyingSleepMinutes(),
                customUnit,
                participantIds,
                normalizeOptional(request.notes()));
    }

    private List<Long> validateParticipantIds(List<Long> participantIds) {
        if (participantIds == null || participantIds.size() != 2) {
            throw new IllegalArgumentException("Exactly two participant profile IDs are required");
        }
        if (participantIds.get(0) == null || participantIds.get(1) == null) {
            throw new IllegalArgumentException("Participant profile IDs are required");
        }
        if (participantIds.get(0).equals(participantIds.get(1))) {
            throw new IllegalArgumentException("Participant profile IDs must be distinct");
        }
        return List.copyOf(participantIds);
    }

    private List<UserProfile> findParticipantProfiles(List<Long> participantIds) {
        return participantIds.stream()
                .map(profileId -> userProfileRepository.findById(profileId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "User profile not found with id: " + profileId)))
                .toList();
    }

    private void validateTypeSpecificConfiguration(CoupleChallengeRequest request) {
        if (request.challengeType() == ChallengeType.SLEEP_TARGET_DAYS) {
            if (request.qualifyingSleepMinutes() == null
                    || request.qualifyingSleepMinutes() < 1
                    || request.qualifyingSleepMinutes() > MAXIMUM_SLEEP_MINUTES) {
                throw new IllegalArgumentException(
                        "Qualifying sleep minutes must be between 1 and 1440");
            }
        } else if (request.qualifyingSleepMinutes() != null) {
            throw new IllegalArgumentException(
                    "Qualifying sleep minutes are only available for sleep target challenges");
        }
        if (request.challengeType() != ChallengeType.CUSTOM_CHECK_IN
                && normalizeOptional(request.customUnit()) != null) {
            throw new IllegalArgumentException(
                    "Custom unit is only available for custom check-in challenges");
        }
    }

    private void validateImmutableParticipants(
            List<CoupleChallengeParticipant> participants,
            List<Long> requestedProfileIds) {
        Set<Long> existingIds = new HashSet<>(participants.stream()
                .map(participant -> participant.getUserProfile().getId())
                .toList());
        if (!existingIds.equals(new HashSet<>(requestedProfileIds))) {
            throw new IllegalArgumentException("Challenge participants cannot be changed after creation");
        }
    }

    private void rejectDateRangeExcludingCheckIns(
            Long challengeId,
            LocalDate startDate,
            LocalDate endDate) {
        boolean excludesCheckIn = checkInRepository
                .findByParticipantCoupleChallengeIdOrderByCheckInDateAscCreatedAtAscIdAsc(
                        challengeId)
                .stream()
                .anyMatch(checkIn -> checkIn.getCheckInDate().isBefore(startDate)
                        || checkIn.getCheckInDate().isAfter(endDate));
        if (excludesCheckIn) {
            throw new IllegalArgumentException(
                    "Challenge date range must include all existing check-ins");
        }
    }

    private void validateCheckIn(
            LocalDate date,
            ProgressCheckInRequest request,
            CoupleChallenge challenge,
            LocalDate today) {
        if (date == null) {
            throw new IllegalArgumentException("Check-in date is required");
        }
        if (date.isBefore(challenge.getStartDate()) || date.isAfter(challenge.getEndDate())) {
            throw new IllegalArgumentException("Check-in date must be within the challenge date range");
        }
        if (date.isAfter(today)) {
            throw new IllegalArgumentException("Check-in date must not be in the future");
        }
        if (request == null || request.completed() == null) {
            throw new IllegalArgumentException("Completed is required");
        }
        if (request.notes() != null && request.notes().length() > MAXIMUM_NOTES_LENGTH) {
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
    }

    private ParticipantProgressResponse toParticipantProgress(
            ParticipantCalculation calculation,
            boolean bothCompleted) {
        CoupleChallengeParticipant participant = calculation.participant();
        ProgressCalculationResult result = calculation.result();
        int points = calculatePoints(result);
        if (bothCompleted) {
            points += 5;
        }
        return new ParticipantProgressResponse(
                participant.getUserProfile().getId(),
                participant.getUserProfile().getName(),
                result.currentValue(),
                result.targetValue(),
                result.displayUnit(),
                result.progressPercentage(),
                points,
                result.goalReached(),
                result.progressAvailable(),
                result.message()
        );
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

    private LeaderResult determineLeader(
            List<ParticipantCalculation> calculations,
            boolean progressAvailable) {
        if (!progressAvailable) {
            return new LeaderResult(null, false);
        }
        long firstValue = calculations.get(0).result().currentValue();
        long secondValue = calculations.get(1).result().currentValue();
        if (firstValue == secondValue) {
            return new LeaderResult(null, true);
        }
        CoupleChallengeParticipant leader = firstValue > secondValue
                ? calculations.get(0).participant()
                : calculations.get(1).participant();
        return new LeaderResult(leader.getUserProfile().getId(), false);
    }

    private OutcomeMessages determineOutcome(
            ChallengeStatus status,
            List<ParticipantCalculation> calculations,
            boolean progressAvailable,
            boolean bothCompleted,
            boolean tie) {
        if (status == ChallengeStatus.UPCOMING) {
            return new OutcomeMessages(
                    "Challenge has not started",
                    "Both participants can begin when the challenge starts.");
        }
        if (!progressAvailable) {
            return new OutcomeMessages(
                    "Progress is currently unavailable",
                    "Progress will appear when the required tracking information is available.");
        }
        if (status == ChallengeStatus.COMPLETED) {
            return new OutcomeMessages(
                    "Challenge completed",
                    bothCompleted
                            ? "Both participants reached the target."
                            : "The challenge period is complete.");
        }
        if (bothCompleted) {
            return new OutcomeMessages(
                    "Both participants reached the target",
                    "Both participants completed the shared target.");
        }
        boolean bothMakingProgress = calculations.stream()
                .allMatch(calculation -> calculation.result().currentValue() > 0L);
        if (tie) {
            return new OutcomeMessages(
                    "It is a tie",
                    bothMakingProgress
                            ? "Both are making progress."
                            : "Both participants currently have the same progress.");
        }
        return new OutcomeMessages(
                "One participant is currently ahead",
                bothMakingProgress
                        ? "Both are making progress."
                        : "Progress can change throughout the challenge.");
    }

    private ChallengeCheckInResponse toCheckInResponse(ChallengeCheckIn checkIn) {
        CoupleChallengeParticipant participant = checkIn.getParticipant();
        return new ChallengeCheckInResponse(
                checkIn.getId(),
                participant.getCoupleChallenge().getId(),
                participant.getUserProfile().getId(),
                checkIn.getCheckInDate(),
                checkIn.isCompleted(),
                checkIn.getNotes(),
                checkIn.getCreatedAt(),
                checkIn.getUpdatedAt()
        );
    }

    private CoupleChallengeResponse toChallengeResponse(
            CoupleChallenge challenge,
            List<CoupleChallengeParticipant> participants,
            LocalDate today) {
        List<CoupleChallengeParticipantResponse> participantResponses = participants.stream()
                .map(participant -> new CoupleChallengeParticipantResponse(
                        participant.getUserProfile().getId(),
                        participant.getUserProfile().getName()))
                .toList();
        return new CoupleChallengeResponse(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getChallengeType(),
                challenge.getStartDate(),
                challenge.getEndDate(),
                challenge.getTargetValue(),
                challenge.getQualifyingSleepMinutes(),
                challenge.getCustomUnit(),
                displayUnit(challenge),
                effectiveStatus(challenge, today),
                participantResponses,
                challenge.getNotes(),
                challenge.getCompletedAt(),
                challenge.getCancelledAt(),
                challenge.getCreatedAt(),
                challenge.getUpdatedAt()
        );
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

    private void requireNonTerminal(
            CoupleChallenge challenge,
            LocalDate today,
            String message) {
        ChallengeStatus status = effectiveStatus(challenge, today);
        if (status == ChallengeStatus.COMPLETED || status == ChallengeStatus.CANCELLED) {
            throw new IllegalArgumentException(message);
        }
    }

    private CoupleChallenge findChallengeOrThrow(Long challengeId) {
        return challengeRepository.findById(challengeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Couple challenge not found with id: " + challengeId));
    }

    private List<CoupleChallengeParticipant> findParticipants(Long challengeId) {
        return participantRepository.findByCoupleChallengeIdOrderByCreatedAtAscIdAsc(challengeId);
    }

    private String normalizeRequiredTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Challenge title is required");
        }
        String trimmed = title.trim();
        if (trimmed.length() > MAXIMUM_TITLE_LENGTH) {
            throw new IllegalArgumentException("Challenge title must not exceed 100 characters");
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

    private boolean isDayBased(ChallengeType challengeType) {
        return challengeType != ChallengeType.ACTIVITY_MINUTES;
    }

    private String displayUnit(CoupleChallenge challenge) {
        return switch (challenge.getChallengeType()) {
            case ACTIVITY_MINUTES -> "minutes";
            case WATER_GOAL_DAYS, SLEEP_TARGET_DAYS, HEALTH_LOGGING_STREAK -> "days";
            case CUSTOM_CHECK_IN -> challenge.getCustomUnit() == null
                    ? "check-ins"
                    : challenge.getCustomUnit();
        };
    }

    private void applyValidatedRequest(
            CoupleChallenge challenge,
            ValidatedChallengeRequest request) {
        challenge.setTitle(request.title());
        challenge.setStartDate(request.startDate());
        challenge.setEndDate(request.endDate());
        challenge.setTargetValue(request.targetValue());
        challenge.setQualifyingSleepMinutes(request.qualifyingSleepMinutes());
        challenge.setCustomUnit(request.customUnit());
        challenge.setNotes(request.notes());
    }

    private void validateToday(LocalDate today) {
        if (today == null) {
            throw new IllegalArgumentException("Today is required");
        }
    }

    private record ValidatedChallengeRequest(
            String title,
            ChallengeType challengeType,
            LocalDate startDate,
            LocalDate endDate,
            Long targetValue,
            Integer qualifyingSleepMinutes,
            String customUnit,
            List<Long> participantUserProfileIds,
            String notes
    ) {
    }

    private record ParticipantCalculation(
            CoupleChallengeParticipant participant,
            ProgressCalculationResult result
    ) {
    }

    private record LeaderResult(Long userProfileId, boolean tie) {
    }

    private record OutcomeMessages(String outcome, String supportiveMessage) {
    }
}
