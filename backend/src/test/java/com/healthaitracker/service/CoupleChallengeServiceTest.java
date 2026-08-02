package com.healthaitracker.service;

import com.healthaitracker.dto.ChallengeCheckInResponse;
import com.healthaitracker.dto.ChallengeStatusRequest;
import com.healthaitracker.dto.CoupleChallengeProgressResponse;
import com.healthaitracker.dto.CoupleChallengeRequest;
import com.healthaitracker.dto.CoupleChallengeResponse;
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
class CoupleChallengeServiceTest {

    private static final Long CHALLENGE_ID = 10L;
    private static final LocalDate TODAY = LocalDate.of(2026, 1, 15);
    private static final LocalDate START_DATE = LocalDate.of(2026, 1, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 1, 31);

    @Mock
    private CoupleChallengeRepository challengeRepository;
    @Mock
    private CoupleChallengeParticipantRepository participantRepository;
    @Mock
    private ChallengeCheckInRepository checkInRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private ProgressCalculationService progressCalculationService;

    private CoupleChallengeService service;
    private UserProfile husband;
    private UserProfile wife;

    @BeforeEach
    void setUp() {
        service = new CoupleChallengeService(
                challengeRepository,
                participantRepository,
                checkInRepository,
                userProfileRepository,
                progressCalculationService);
        husband = profile(1L, "Husband");
        wife = profile(2L, "Wife");
    }

    @Test
    void createsChallengeWithTwoDistinctProfilesInRequestOrder() {
        stubProfiles();
        when(challengeRepository.save(any(CoupleChallenge.class))).thenAnswer(invocation -> {
            CoupleChallenge challenge = invocation.getArgument(0);
            challenge.setId(CHALLENGE_ID);
            return challenge;
        });
        when(participantRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CoupleChallengeResponse response = service.createChallenge(
                request(ChallengeType.ACTIVITY_MINUTES, 600L, null, null, List.of(1L, 2L)),
                TODAY);

        assertThat(response.id()).isEqualTo(CHALLENGE_ID);
        assertThat(response.status()).isEqualTo(ChallengeStatus.ACTIVE);
        assertThat(response.displayUnit()).isEqualTo("minutes");
        assertThat(response.participants()).extracting(participant -> participant.userProfileId())
                .containsExactly(1L, 2L);
        assertThat(response.participants()).extracting(participant -> participant.profileName())
                .containsExactly("Husband", "Wife");
    }

    @Test
    void rejectsDuplicateMissingOrUnknownParticipants() {
        assertThatThrownBy(() -> service.createChallenge(
                request(ChallengeType.ACTIVITY_MINUTES, 100L, null, null, List.of(1L, 1L)),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Participant profile IDs must be distinct");
        assertThatThrownBy(() -> service.createChallenge(
                request(ChallengeType.ACTIVITY_MINUTES, 100L, null, null, List.of(1L)),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Exactly two participant profile IDs are required");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(husband));
        when(userProfileRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createChallenge(
                request(ChallengeType.ACTIVITY_MINUTES, 100L, null, null, List.of(1L, 99L)),
                TODAY))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User profile not found with id: 99");
    }

    @Test
    void validatesDayTargetsAndSleepConfiguration() {
        assertThatThrownBy(() -> service.createChallenge(
                request(ChallengeType.WATER_GOAL_DAYS, 32L, null, null, List.of(1L, 2L)),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Target value must not exceed the inclusive challenge duration");
        assertThatThrownBy(() -> service.createChallenge(
                request(ChallengeType.SLEEP_TARGET_DAYS, 7L, null, null, List.of(1L, 2L)),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Qualifying sleep minutes must be between 1 and 1440");
        assertThatThrownBy(() -> service.createChallenge(
                request(ChallengeType.ACTIVITY_MINUTES, 100L, 420, null, List.of(1L, 2L)),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Qualifying sleep minutes are only available for sleep target challenges");
    }

    @Test
    void preservesImmutableChallengeTypeAndParticipantMembership() {
        CoupleChallenge challenge = challenge(ChallengeType.ACTIVITY_MINUTES, START_DATE, END_DATE);
        stubChallenge(challenge, List.of(participant(101L, husband, challenge), participant(102L, wife, challenge)));

        assertThatThrownBy(() -> service.updateChallenge(
                CHALLENGE_ID,
                request(ChallengeType.WATER_GOAL_DAYS, 10L, null, null, List.of(1L, 2L)),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Challenge type cannot be changed after creation");

        UserProfile other = profile(3L, "Other");
        assertThatThrownBy(() -> service.updateChallenge(
                CHALLENGE_ID,
                request(ChallengeType.ACTIVITY_MINUTES, 100L, null, null, List.of(1L, 3L)),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Challenge participants cannot be changed after creation");
        verify(userProfileRepository, never()).findById(other.getId());
    }

    @Test
    void derivesUpcomingActiveAndEndedStatusesWithoutPersistingReadChanges() {
        CoupleChallenge challenge = challenge(ChallengeType.ACTIVITY_MINUTES, START_DATE, END_DATE);
        when(challengeRepository.findById(CHALLENGE_ID)).thenReturn(Optional.of(challenge));
        when(participantRepository.findByCoupleChallengeIdOrderByCreatedAtAscIdAsc(CHALLENGE_ID))
                .thenReturn(List.of(participant(101L, husband, challenge), participant(102L, wife, challenge)));

        CoupleChallengeResponse upcoming = service.getChallenge(CHALLENGE_ID, START_DATE.minusDays(1));
        CoupleChallengeResponse active = service.getChallenge(CHALLENGE_ID, START_DATE);
        CoupleChallengeResponse ended = service.getChallenge(CHALLENGE_ID, END_DATE.plusDays(1));

        assertThat(upcoming.status()).isEqualTo(ChallengeStatus.UPCOMING);
        assertThat(active.status()).isEqualTo(ChallengeStatus.ACTIVE);
        assertThat(ended.status()).isEqualTo(ChallengeStatus.COMPLETED);
        assertThat(challenge.getStatus()).isEqualTo(ChallengeStatus.ACTIVE);
        assertThat(challenge.getCompletedAt()).isNull();
        verify(challengeRepository, never()).save(any());
    }

    @Test
    void appliesExplicitCompletionAndCancellationLifecycleRules() {
        CoupleChallenge active = challenge(ChallengeType.ACTIVITY_MINUTES, START_DATE, END_DATE);
        CoupleChallenge upcoming = challenge(
                ChallengeType.ACTIVITY_MINUTES, TODAY.plusDays(1), TODAY.plusDays(10));
        upcoming.setId(11L);
        when(challengeRepository.findById(CHALLENGE_ID)).thenReturn(Optional.of(active));
        when(challengeRepository.findById(11L)).thenReturn(Optional.of(upcoming));
        when(participantRepository.findByCoupleChallengeIdOrderByCreatedAtAscIdAsc(any()))
                .thenReturn(List.of());
        when(challengeRepository.save(any(CoupleChallenge.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CoupleChallengeResponse completed = service.updateChallengeStatus(
                CHALLENGE_ID,
                new ChallengeStatusRequest(ChallengeStatus.COMPLETED),
                TODAY);
        CoupleChallengeResponse cancelled = service.updateChallengeStatus(
                11L,
                new ChallengeStatusRequest(ChallengeStatus.CANCELLED),
                TODAY);

        assertThat(completed.status()).isEqualTo(ChallengeStatus.COMPLETED);
        assertThat(completed.completedAt()).isNotNull();
        assertThat(completed.cancelledAt()).isNull();
        assertThat(cancelled.status()).isEqualTo(ChallengeStatus.CANCELLED);
        assertThat(cancelled.cancelledAt()).isNotNull();
        assertThatThrownBy(() -> service.updateChallengeStatus(
                CHALLENGE_ID,
                new ChallengeStatusRequest(ChallengeStatus.ACTIVE),
                TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Completed and cancelled challenges are terminal");
    }

    @Test
    void upsertsParticipantCustomCheckInAndPreservesIdentity() {
        CoupleChallenge challenge = challenge(ChallengeType.CUSTOM_CHECK_IN, START_DATE, END_DATE);
        CoupleChallengeParticipant participant = participant(101L, husband, challenge);
        ChallengeCheckIn existing = new ChallengeCheckIn();
        existing.setId(50L);
        existing.setParticipant(participant);
        existing.setCheckInDate(TODAY);
        existing.setCreatedAt(LocalDateTime.of(2026, 1, 15, 8, 0));
        when(challengeRepository.findById(CHALLENGE_ID)).thenReturn(Optional.of(challenge));
        when(participantRepository.findByCoupleChallengeIdAndUserProfileId(CHALLENGE_ID, 1L))
                .thenReturn(Optional.of(participant));
        when(checkInRepository.findByParticipantIdAndCheckInDate(101L, TODAY))
                .thenReturn(Optional.of(existing));
        when(checkInRepository.save(existing)).thenReturn(existing);

        ChallengeCheckInResponse response = service.upsertChallengeCheckIn(
                CHALLENGE_ID,
                1L,
                TODAY,
                new ProgressCheckInRequest(true, "  completed  "),
                TODAY);

        assertThat(response.id()).isEqualTo(50L);
        assertThat(response.participantUserProfileId()).isEqualTo(1L);
        assertThat(response.completed()).isTrue();
        assertThat(response.notes()).isEqualTo("completed");
        assertThat(response.createdAt()).isEqualTo(LocalDateTime.of(2026, 1, 15, 8, 0));
    }

    @Test
    void rejectsNonparticipantAndNonCustomCheckInsWithoutRevealingMembership() {
        CoupleChallenge custom = challenge(ChallengeType.CUSTOM_CHECK_IN, START_DATE, END_DATE);
        when(challengeRepository.findById(CHALLENGE_ID)).thenReturn(Optional.of(custom));
        when(participantRepository.findByCoupleChallengeIdAndUserProfileId(CHALLENGE_ID, 99L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.upsertChallengeCheckIn(
                CHALLENGE_ID, 99L, TODAY, new ProgressCheckInRequest(true, null), TODAY))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Challenge participant not found");

        CoupleChallenge activity = challenge(ChallengeType.ACTIVITY_MINUTES, START_DATE, END_DATE);
        when(challengeRepository.findById(CHALLENGE_ID)).thenReturn(Optional.of(activity));
        assertThatThrownBy(() -> service.upsertChallengeCheckIn(
                CHALLENGE_ID, 1L, TODAY, new ProgressCheckInRequest(true, null), TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Check-ins are only available for custom check-in challenges");
    }

    @Test
    void rejectsDateUpdateThatWouldExcludeAnyParticipantCheckIn() {
        CoupleChallenge challenge = challenge(ChallengeType.CUSTOM_CHECK_IN, START_DATE, END_DATE);
        ChallengeCheckIn checkIn = new ChallengeCheckIn();
        checkIn.setCheckInDate(START_DATE);
        List<CoupleChallengeParticipant> participants =
                List.of(participant(101L, husband, challenge), participant(102L, wife, challenge));
        stubChallenge(challenge, participants);
        stubProfiles();
        when(checkInRepository
                .findByParticipantCoupleChallengeIdOrderByCheckInDateAscCreatedAtAscIdAsc(CHALLENGE_ID))
                .thenReturn(List.of(checkIn));
        CoupleChallengeRequest narrowed = new CoupleChallengeRequest(
                "Custom", ChallengeType.CUSTOM_CHECK_IN, START_DATE.plusDays(1), END_DATE,
                5L, null, "sessions", List.of(1L, 2L), null);

        assertThatThrownBy(() -> service.updateChallenge(CHALLENGE_ID, narrowed, TODAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Challenge date range must include all existing check-ins");
    }

    @Test
    void calculatesIsolatedParticipantProgressAndSelectsTheLeader() {
        CoupleChallenge challenge = challenge(ChallengeType.ACTIVITY_MINUTES, START_DATE, END_DATE);
        CoupleChallengeParticipant first = participant(101L, husband, challenge);
        CoupleChallengeParticipant second = participant(102L, wife, challenge);
        stubChallenge(challenge, List.of(first, second));
        when(progressCalculationService.calculateChallengeProgress(challenge, first, TODAY))
                .thenReturn(progress(60L, "60.00", false));
        when(progressCalculationService.calculateChallengeProgress(challenge, second, TODAY))
                .thenReturn(progress(40L, "40.00", false));

        CoupleChallengeProgressResponse response = service.getChallengeProgress(CHALLENGE_ID, TODAY);

        assertThat(response.participantProgress()).extracting(progress -> progress.userProfileId())
                .containsExactly(1L, 2L);
        assertThat(response.participantProgress()).extracting(progress -> progress.currentValue())
                .containsExactly(60L, 40L);
        assertThat(response.leaderUserProfileId()).isEqualTo(1L);
        assertThat(response.tie()).isFalse();
        assertThat(response.bothCompleted()).isFalse();
        assertThat(response.outcome()).isEqualTo("One participant is currently ahead");
        verify(progressCalculationService).calculateChallengeProgress(challenge, first, TODAY);
        verify(progressCalculationService).calculateChallengeProgress(challenge, second, TODAY);
    }

    @Test
    void returnsTieAndAddsSharedCompletionBonusForBothParticipants() {
        CoupleChallenge challenge = challenge(ChallengeType.ACTIVITY_MINUTES, START_DATE, END_DATE);
        CoupleChallengeParticipant first = participant(101L, husband, challenge);
        CoupleChallengeParticipant second = participant(102L, wife, challenge);
        stubChallenge(challenge, List.of(first, second));
        when(progressCalculationService.calculateChallengeProgress(challenge, first, TODAY))
                .thenReturn(progress(100L, "100.00", true));
        when(progressCalculationService.calculateChallengeProgress(challenge, second, TODAY))
                .thenReturn(progress(100L, "100.00", true));

        CoupleChallengeProgressResponse response = service.getChallengeProgress(CHALLENGE_ID, TODAY);

        assertThat(response.leaderUserProfileId()).isNull();
        assertThat(response.tie()).isTrue();
        assertThat(response.bothCompleted()).isTrue();
        assertThat(response.outcome()).isEqualTo("Both participants reached the target");
        assertThat(response.participantProgress()).extracting(progress -> progress.points())
                .containsExactly(25, 25);
    }

    @Test
    void suppressesLeaderAndTieWhenEitherProgressIsUnavailable() {
        CoupleChallenge challenge = challenge(ChallengeType.WATER_GOAL_DAYS, START_DATE, END_DATE);
        CoupleChallengeParticipant first = participant(101L, husband, challenge);
        CoupleChallengeParticipant second = participant(102L, wife, challenge);
        stubChallenge(challenge, List.of(first, second));
        when(progressCalculationService.calculateChallengeProgress(challenge, first, TODAY))
                .thenReturn(new ProgressCalculationResult(
                        null, 10L, null, null, false, "days", "Water goal unavailable"));
        when(progressCalculationService.calculateChallengeProgress(challenge, second, TODAY))
                .thenReturn(progress(5L, "50.00", false));

        CoupleChallengeProgressResponse response = service.getChallengeProgress(CHALLENGE_ID, TODAY);

        assertThat(response.leaderUserProfileId()).isNull();
        assertThat(response.tie()).isFalse();
        assertThat(response.bothCompleted()).isFalse();
        assertThat(response.outcome()).isEqualTo("Progress is currently unavailable");
        assertThat(response.participantProgress()).extracting(progress -> progress.points())
                .containsExactly(0, 5);
    }

    @Test
    void deletesCheckInsParticipantsAndChallengeInSafeOrder() {
        CoupleChallenge challenge = challenge(ChallengeType.CUSTOM_CHECK_IN, START_DATE, END_DATE);
        when(challengeRepository.findById(CHALLENGE_ID)).thenReturn(Optional.of(challenge));

        service.deleteChallenge(CHALLENGE_ID);

        InOrder order = inOrder(checkInRepository, participantRepository, challengeRepository);
        order.verify(checkInRepository).deleteByParticipantCoupleChallengeId(CHALLENGE_ID);
        order.verify(participantRepository).deleteByCoupleChallengeId(CHALLENGE_ID);
        order.verify(challengeRepository).delete(challenge);
    }

    private void stubChallenge(
            CoupleChallenge challenge,
            List<CoupleChallengeParticipant> participants) {
        when(challengeRepository.findById(CHALLENGE_ID)).thenReturn(Optional.of(challenge));
        when(participantRepository.findByCoupleChallengeIdOrderByCreatedAtAscIdAsc(CHALLENGE_ID))
                .thenReturn(participants);
    }

    private void stubProfiles() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(husband));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.of(wife));
    }

    private UserProfile profile(Long id, String name) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setName(name);
        return profile;
    }

    private CoupleChallenge challenge(
            ChallengeType type,
            LocalDate startDate,
            LocalDate endDate) {
        CoupleChallenge challenge = new CoupleChallenge();
        challenge.setId(CHALLENGE_ID);
        challenge.setTitle("Challenge");
        challenge.setChallengeType(type);
        challenge.setStartDate(startDate);
        challenge.setEndDate(endDate);
        challenge.setTargetValue(type == ChallengeType.ACTIVITY_MINUTES ? 100L : 10L);
        challenge.setCustomUnit(type == ChallengeType.CUSTOM_CHECK_IN ? "sessions" : null);
        challenge.setStatus(ChallengeStatus.ACTIVE);
        challenge.setCreatedAt(LocalDateTime.of(2026, 1, 1, 8, 0));
        challenge.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 8, 0));
        return challenge;
    }

    private CoupleChallengeParticipant participant(
            Long id,
            UserProfile profile,
            CoupleChallenge challenge) {
        CoupleChallengeParticipant participant = new CoupleChallengeParticipant();
        participant.setId(id);
        participant.setUserProfile(profile);
        participant.setCoupleChallenge(challenge);
        participant.setCreatedAt(LocalDateTime.of(2026, 1, 1, 9, 0).plusMinutes(id));
        return participant;
    }

    private CoupleChallengeRequest request(
            ChallengeType type,
            Long target,
            Integer sleepMinutes,
            String customUnit,
            List<Long> participantIds) {
        return new CoupleChallengeRequest(
                "  Couple challenge  ",
                type,
                START_DATE,
                END_DATE,
                target,
                sleepMinutes,
                customUnit,
                participantIds,
                "  ");
    }

    private ProgressCalculationResult progress(Long current, String percentage, boolean reached) {
        return new ProgressCalculationResult(
                current,
                100L,
                new BigDecimal(percentage),
                reached,
                true,
                "minutes",
                null);
    }
}
