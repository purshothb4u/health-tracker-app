package com.healthaitracker.service;

import com.healthaitracker.dto.DailySleepSummary;
import com.healthaitracker.dto.SleepEntryRequest;
import com.healthaitracker.dto.SleepEntryResponse;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.SleepEntry;
import com.healthaitracker.entity.SleepType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.SleepEntryRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SleepTrackingServiceTest {

    private static final ZoneId APPLICATION_ZONE = ZoneId.of("Asia/Singapore");

    @Mock
    private SleepEntryRepository sleepEntryRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private SleepTrackingService sleepTrackingService;
    private Clock applicationClock;

    @BeforeEach
    void setUp() {
        applicationClock = Clock.system(APPLICATION_ZONE);
        sleepTrackingService = new SleepTrackingService(
                sleepEntryRepository,
                userProfileRepository,
                applicationClock);
    }

    @Test
    void createsCrossMidnightNightSleepAndCalculatesDuration() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDateTime endDateTime = pastEndDateTime();
        LocalDateTime startDateTime = endDateTime.minusHours(8);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.save(any(SleepEntry.class))).thenAnswer(invocation -> {
            SleepEntry entry = invocation.getArgument(0, SleepEntry.class);
            entry.setId(10L);
            entry.setCreatedAt(endDateTime.plusHours(1));
            entry.setUpdatedAt(endDateTime.plusHours(1));
            return entry;
        });

        SleepEntryResponse response = sleepTrackingService.createSleepEntry(
                1L,
                request(
                        endDateTime.toLocalDate(),
                        SleepType.NIGHT_SLEEP,
                        startDateTime,
                        endDateTime,
                        5,
                        "  Restful night  "));

        ArgumentCaptor<SleepEntry> captor = ArgumentCaptor.forClass(SleepEntry.class);
        verify(sleepEntryRepository).save(captor.capture());
        SleepEntry saved = captor.getValue();
        assertThat(saved.getUserProfile()).isSameAs(profile);
        assertThat(saved.getNotes()).isEqualTo("Restful night");
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.userProfileId()).isEqualTo(1L);
        assertThat(response.sleepType()).isEqualTo(SleepType.NIGHT_SLEEP);
        assertThat(response.startDateTime()).isEqualTo(startDateTime);
        assertThat(response.endDateTime()).isEqualTo(endDateTime);
        assertThat(response.durationMinutes()).isEqualTo(480L);
        assertThat(response.qualityRating()).isEqualTo(5);
    }

    @Test
    void createsNapWithNullQualityAndNormalizesBlankNotesToNull() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDateTime endDateTime = pastEndDateTime().withHour(14).withMinute(0);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.save(any(SleepEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, SleepEntry.class));

        SleepEntryResponse response = sleepTrackingService.createSleepEntry(
                1L,
                request(
                        endDateTime.toLocalDate(),
                        SleepType.NAP,
                        endDateTime.minusMinutes(45),
                        endDateTime,
                        null,
                        "   "));

        assertThat(response.sleepType()).isEqualTo(SleepType.NAP);
        assertThat(response.durationMinutes()).isEqualTo(45L);
        assertThat(response.qualityRating()).isNull();
        assertThat(response.notes()).isNull();
    }

    @Test
    void retrievesSelectedDateHistoryInRepositoryOrderAndRetrievesOwnedEntry() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        SleepEntry first = createEntry(profile, 1L, sleepDate, SleepType.NIGHT_SLEEP, 480, 4);
        SleepEntry second = createEntry(profile, 2L, sleepDate, SleepType.NAP, 45, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                1L, sleepDate)).thenReturn(List.of(first, second));
        when(sleepEntryRepository.findByIdAndUserProfileId(2L, 1L)).thenReturn(Optional.of(second));

        List<SleepEntryResponse> entries = sleepTrackingService.getSleepEntries(1L, sleepDate);
        SleepEntryResponse owned = sleepTrackingService.getSleepEntry(1L, 2L);

        assertThat(entries).extracting(SleepEntryResponse::id).containsExactly(1L, 2L);
        assertThat(owned.id()).isEqualTo(2L);
        verify(sleepEntryRepository)
                .findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(1L, sleepDate);
    }

    @Test
    void updatesOwnedEntryWhilePreservingIdentityOwnerAndCreatedAt() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate sleepDate = LocalDate.now().minusDays(2);
        SleepEntry entry = createEntry(profile, 5L, sleepDate, SleepType.NIGHT_SLEEP, 480, 3);
        LocalDateTime originalCreatedAt = sleepDate.atTime(8, 0);
        entry.setCreatedAt(originalCreatedAt);
        LocalDateTime newEnd = sleepDate.plusDays(1).atTime(14, 0);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.findByIdAndUserProfileId(5L, 1L)).thenReturn(Optional.of(entry));
        when(sleepEntryRepository.save(entry)).thenReturn(entry);

        SleepEntryResponse response = sleepTrackingService.updateSleepEntry(
                1L,
                5L,
                request(
                        newEnd.toLocalDate(),
                        SleepType.NAP,
                        newEnd.minusMinutes(60),
                        newEnd,
                        4,
                        "  Updated  "));

        assertThat(entry.getId()).isEqualTo(5L);
        assertThat(entry.getUserProfile()).isSameAs(profile);
        assertThat(entry.getCreatedAt()).isEqualTo(originalCreatedAt);
        assertThat(response.sleepType()).isEqualTo(SleepType.NAP);
        assertThat(response.durationMinutes()).isEqualTo(60L);
        assertThat(response.notes()).isEqualTo("Updated");
    }

    @Test
    void deletesOwnedEntry() {
        UserProfile profile = createProfile(1L, "Husband");
        SleepEntry entry = createEntry(
                profile, 5L, LocalDate.now().minusDays(1), SleepType.NAP, 30, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.findByIdAndUserProfileId(5L, 1L)).thenReturn(Optional.of(entry));

        sleepTrackingService.deleteSleepEntry(1L, 5L);

        verify(sleepEntryRepository).delete(entry);
    }

    @Test
    void rejectsCrossProfileRetrieveUpdateAndDeleteAsNotFound() {
        UserProfile wife = createProfile(2L, "Wife");
        when(userProfileRepository.findById(2L)).thenReturn(Optional.of(wife));
        when(sleepEntryRepository.findByIdAndUserProfileId(5L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sleepTrackingService.getSleepEntry(2L, 5L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Sleep entry not found with id: 5");
        assertThatThrownBy(() -> sleepTrackingService.updateSleepEntry(2L, 5L, validRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Sleep entry not found with id: 5");
        assertThatThrownBy(() -> sleepTrackingService.deleteSleepEntry(2L, 5L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Sleep entry not found with id: 5");
        verify(sleepEntryRepository, never()).findById(5L);
        verify(sleepEntryRepository, never()).delete(any(SleepEntry.class));
    }

    @Test
    void rejectsMissingProfileAndMissingEntry() {
        when(userProfileRepository.findById(999L)).thenReturn(Optional.empty());
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));
        when(sleepEntryRepository.findByIdAndUserProfileId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sleepTrackingService.createSleepEntry(999L, validRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User profile not found with id: 999");
        assertThatThrownBy(() -> sleepTrackingService.getSleepEntry(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Sleep entry not found with id: 999");
    }

    @Test
    void rejectsNullAndFutureSelectedDatesWithoutDefaulting() {
        assertThatThrownBy(() -> sleepTrackingService.getSleepEntries(1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Sleep date is required");
        assertThatThrownBy(() -> sleepTrackingService.getDailySleepSummary(
                1L, LocalDate.now(applicationClock).plusDays(1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Sleep date must not be in the future");
    }

    @Test
    void rejectsMissingRequestFieldsAndFutureSleepDate() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));
        SleepEntryRequest valid = validRequest();

        assertInvalid(null, "Sleep entry request is required");
        assertInvalid(request(null, SleepType.NIGHT_SLEEP, valid.startDateTime(), valid.endDateTime(),
                        null, null),
                "Sleep date is required");
        assertInvalid(request(LocalDate.now(applicationClock).plusDays(1), SleepType.NIGHT_SLEEP,
                        valid.startDateTime(), valid.endDateTime(), null, null),
                "Sleep date must not be in the future");
        assertInvalid(request(valid.sleepDate(), null, valid.startDateTime(), valid.endDateTime(),
                        null, null),
                "Sleep type is required");
        assertInvalid(request(valid.sleepDate(), SleepType.NIGHT_SLEEP, null, valid.endDateTime(),
                        null, null),
                "Start date and time are required");
        assertInvalid(request(valid.sleepDate(), SleepType.NIGHT_SLEEP, valid.startDateTime(), null,
                        null, null),
                "End date and time are required");
        verify(sleepEntryRepository, never()).save(any(SleepEntry.class));
    }

    @Test
    void rejectsEndBeforeStartEqualTimesFutureEndAndMismatchedSleepDate() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));
        LocalDateTime end = pastEndDateTime();

        assertInvalid(request(end.toLocalDate(), SleepType.NIGHT_SLEEP,
                        end.plusMinutes(1), end, null, null),
                "End date and time must be after start date and time");
        assertInvalid(request(end.toLocalDate(), SleepType.NIGHT_SLEEP,
                        end, end, null, null),
                "End date and time must be after start date and time");

        LocalDateTime futureEnd = LocalDateTime.now(applicationClock).plusMinutes(10);
        assertInvalid(request(futureEnd.toLocalDate(), SleepType.NIGHT_SLEEP,
                        futureEnd.minusMinutes(30), futureEnd, null, null),
                "End date and time must not be in the future");
        assertInvalid(request(end.toLocalDate().minusDays(1), SleepType.NIGHT_SLEEP,
                        end.minusMinutes(30), end, null, null),
                "Sleep date must match the end date");
    }

    @Test
    void comparesWakeTimeUsingConfiguredApplicationClock() {
        Clock singaporeMorning = Clock.fixed(
                Instant.parse("2026-08-21T01:30:00Z"),
                APPLICATION_ZONE);
        SleepTrackingService configuredService = new SleepTrackingService(
                sleepEntryRepository,
                userProfileRepository,
                singaporeMorning);
        UserProfile profile = createProfile(1L, "Husband");
        LocalDateTime wakeTimeEarlierThatMorning = LocalDateTime.of(2026, 8, 21, 9, 0);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.save(any(SleepEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, SleepEntry.class));

        SleepEntryResponse accepted = configuredService.createSleepEntry(
                1L,
                request(
                        wakeTimeEarlierThatMorning.toLocalDate(),
                        SleepType.NIGHT_SLEEP,
                        wakeTimeEarlierThatMorning.minusHours(8),
                        wakeTimeEarlierThatMorning,
                        4,
                        null));

        assertThat(accepted.durationMinutes()).isEqualTo(480L);

        LocalDateTime genuinelyFutureWakeTime = LocalDateTime.of(2026, 8, 21, 9, 31);
        assertThatThrownBy(() -> configuredService.createSleepEntry(
                1L,
                request(
                        genuinelyFutureWakeTime.toLocalDate(),
                        SleepType.NAP,
                        genuinelyFutureWakeTime.minusMinutes(30),
                        genuinelyFutureWakeTime,
                        3,
                        null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("End date and time must not be in the future");
    }

    @Test
    void rejectsDurationBelowOneMinuteAndAboveOneDay() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));
        LocalDateTime end = pastEndDateTime();

        assertInvalid(request(end.toLocalDate(), SleepType.NAP,
                        end.minusSeconds(30), end, null, null),
                "Sleep duration must be between 1 and 1440 minutes");
        assertInvalid(request(end.toLocalDate(), SleepType.NIGHT_SLEEP,
                        end.minusMinutes(1_441), end, null, null),
                "Sleep duration must be between 1 and 1440 minutes");
    }

    @Test
    void rejectsInvalidQualityRatingsAndLongNotes() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));
        SleepEntryRequest valid = validRequest();

        assertInvalid(request(valid.sleepDate(), valid.sleepType(), valid.startDateTime(),
                        valid.endDateTime(), 0, null),
                "Quality rating must be between 1 and 5");
        assertInvalid(request(valid.sleepDate(), valid.sleepType(), valid.startDateTime(),
                        valid.endDateTime(), 6, null),
                "Quality rating must be between 1 and 5");
        assertInvalid(request(valid.sleepDate(), valid.sleepType(), valid.startDateTime(),
                        valid.endDateTime(), null, "n".repeat(501)),
                "Notes must not exceed 500 characters");
    }

    @Test
    void returnsEmptyDaySummary() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                1L, sleepDate)).thenReturn(List.of());

        DailySleepSummary summary = sleepTrackingService.getDailySleepSummary(1L, sleepDate);

        assertThat(summary.userProfileId()).isEqualTo(1L);
        assertThat(summary.sleepDate()).isEqualTo(sleepDate);
        assertThat(summary.sessionCount()).isZero();
        assertThat(summary.totalSleepMinutes()).isZero();
        assertThat(summary.nightSleepMinutes()).isZero();
        assertThat(summary.napMinutes()).isZero();
        assertThat(summary.averageQuality()).isNull();
    }

    @Test
    void aggregatesDurationsByTypeAndAveragesOnlyReportedQuality() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        SleepEntry night = createEntry(profile, 1L, sleepDate, SleepType.NIGHT_SLEEP, 480, 5);
        SleepEntry ratedNap = createEntry(profile, 2L, sleepDate, SleepType.NAP, 45, 4);
        SleepEntry other = createEntry(profile, 3L, sleepDate, SleepType.OTHER, 30, 4);
        SleepEntry unratedNap = createEntry(profile, 4L, sleepDate, SleepType.NAP, 15, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                1L, sleepDate)).thenReturn(List.of(night, ratedNap, other, unratedNap));

        DailySleepSummary summary = sleepTrackingService.getDailySleepSummary(1L, sleepDate);

        assertThat(summary.sessionCount()).isEqualTo(4);
        assertThat(summary.totalSleepMinutes()).isEqualTo(570L);
        assertThat(summary.nightSleepMinutes()).isEqualTo(480L);
        assertThat(summary.napMinutes()).isEqualTo(60L);
        assertThat(summary.averageQuality()).isEqualByComparingTo(new BigDecimal("4.33"));
        assertThat(summary.averageQuality().scale()).isEqualTo(2);
    }

    @Test
    void returnsNullAverageWhenNoSessionHasQuality() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        SleepEntry night = createEntry(profile, 1L, sleepDate, SleepType.NIGHT_SLEEP, 480, null);
        SleepEntry nap = createEntry(profile, 2L, sleepDate, SleepType.NAP, 30, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(sleepEntryRepository.findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                1L, sleepDate)).thenReturn(List.of(night, nap));

        DailySleepSummary summary = sleepTrackingService.getDailySleepSummary(1L, sleepDate);

        assertThat(summary.averageQuality()).isNull();
        assertThat(summary.totalSleepMinutes()).isEqualTo(510L);
    }

    @Test
    void keepsHusbandAndWifeSleepDataIsolated() {
        UserProfile husband = createProfile(1L, "Husband");
        UserProfile wife = createProfile(2L, "Wife");
        LocalDate sleepDate = LocalDate.now().minusDays(1);
        SleepEntry husbandEntry = createEntry(
                husband, 1L, sleepDate, SleepType.NIGHT_SLEEP, 480, 4);
        SleepEntry wifeEntry = createEntry(wife, 2L, sleepDate, SleepType.NAP, 60, 5);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(husband));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.of(wife));
        when(sleepEntryRepository.findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                1L, sleepDate)).thenReturn(List.of(husbandEntry));
        when(sleepEntryRepository.findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                2L, sleepDate)).thenReturn(List.of(wifeEntry));

        DailySleepSummary husbandSummary = sleepTrackingService.getDailySleepSummary(1L, sleepDate);
        DailySleepSummary wifeSummary = sleepTrackingService.getDailySleepSummary(2L, sleepDate);

        assertThat(husbandSummary.userProfileId()).isEqualTo(1L);
        assertThat(husbandSummary.totalSleepMinutes()).isEqualTo(480L);
        assertThat(wifeSummary.userProfileId()).isEqualTo(2L);
        assertThat(wifeSummary.totalSleepMinutes()).isEqualTo(60L);
        verify(sleepEntryRepository)
                .findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(1L, sleepDate);
        verify(sleepEntryRepository)
                .findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(2L, sleepDate);
    }

    private void assertInvalid(SleepEntryRequest request, String expectedMessage) {
        assertThatThrownBy(() -> sleepTrackingService.createSleepEntry(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(expectedMessage);
    }

    private SleepEntryRequest validRequest() {
        LocalDateTime endDateTime = pastEndDateTime();
        return request(
                endDateTime.toLocalDate(),
                SleepType.NIGHT_SLEEP,
                endDateTime.minusHours(8),
                endDateTime,
                4,
                null);
    }

    private SleepEntryRequest request(
            LocalDate sleepDate,
            SleepType sleepType,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            Integer qualityRating,
            String notes) {
        return new SleepEntryRequest(
                sleepDate,
                sleepType,
                startDateTime,
                endDateTime,
                qualityRating,
                notes);
    }

    private LocalDateTime pastEndDateTime() {
        return LocalDate.now(applicationClock).minusDays(1).atTime(6, 30);
    }

    private UserProfile createProfile(Long id, String name) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setName(name);
        profile.setGender(Gender.OTHER);
        profile.setAge(30);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(70.0);
        profile.setCurrentWeightKg(70.0);
        profile.setTargetWeightKg(65.0);
        return profile;
    }

    private SleepEntry createEntry(
            UserProfile profile,
            Long id,
            LocalDate sleepDate,
            SleepType sleepType,
            long durationMinutes,
            Integer qualityRating) {
        LocalDateTime endDateTime = sleepDate.atTime(8, 0);
        SleepEntry entry = new SleepEntry();
        entry.setId(id);
        entry.setUserProfile(profile);
        entry.setSleepDate(sleepDate);
        entry.setSleepType(sleepType);
        entry.setStartDateTime(endDateTime.minusMinutes(durationMinutes));
        entry.setEndDateTime(endDateTime);
        entry.setQualityRating(qualityRating);
        entry.setCreatedAt(endDateTime.plusMinutes(id));
        entry.setUpdatedAt(endDateTime.plusMinutes(id));
        return entry;
    }
}
