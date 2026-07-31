package com.healthaitracker.service;

import com.healthaitracker.dto.ActivityEntryRequest;
import com.healthaitracker.dto.ActivityEntryResponse;
import com.healthaitracker.dto.DailyActivitySummary;
import com.healthaitracker.entity.ActivityCategory;
import com.healthaitracker.entity.ActivityEntry;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityTrackingServiceTest {

    @Mock
    private ActivityEntryRepository activityEntryRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private ActivityTrackingService activityTrackingService;

    @BeforeEach
    void setUp() {
        activityTrackingService = new ActivityTrackingService(
                activityEntryRepository,
                userProfileRepository);
    }

    @Test
    void createsActivityWithAllFieldsAndNormalizesText() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate activityDate = LocalDate.now();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.save(any(ActivityEntry.class))).thenAnswer(invocation -> {
            ActivityEntry entry = invocation.getArgument(0, ActivityEntry.class);
            entry.setId(10L);
            entry.setCreatedAt(LocalDateTime.now().minusMinutes(1));
            entry.setUpdatedAt(LocalDateTime.now());
            return entry;
        });

        ActivityEntryResponse response = activityTrackingService.createActivityEntry(
                1L,
                new ActivityEntryRequest(
                        activityDate,
                        ActivityCategory.RUNNING,
                        "  Evening run  ",
                        45,
                        8_000,
                        new BigDecimal("6.250"),
                        420,
                        "  User-reported session  "));

        ArgumentCaptor<ActivityEntry> captor = ArgumentCaptor.forClass(ActivityEntry.class);
        verify(activityEntryRepository).save(captor.capture());
        ActivityEntry saved = captor.getValue();
        assertThat(saved.getUserProfile()).isSameAs(profile);
        assertThat(saved.getActivityName()).isEqualTo("Evening run");
        assertThat(saved.getNotes()).isEqualTo("User-reported session");
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.userProfileId()).isEqualTo(1L);
        assertThat(response.activityDate()).isEqualTo(activityDate);
        assertThat(response.category()).isEqualTo(ActivityCategory.RUNNING);
        assertThat(response.durationMinutes()).isEqualTo(45);
        assertThat(response.steps()).isEqualTo(8_000);
        assertThat(response.distanceKm()).isEqualByComparingTo("6.250");
        assertThat(response.reportedCaloriesBurned()).isEqualTo(420);
    }

    @Test
    void createsActivityWithOptionalFieldsAbsentAndNormalizesBlankNotesToNull() {
        UserProfile profile = createProfile(1L, "Husband");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.save(any(ActivityEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, ActivityEntry.class));

        ActivityEntryResponse response = activityTrackingService.createActivityEntry(
                1L,
                new ActivityEntryRequest(
                        LocalDate.now(),
                        ActivityCategory.YOGA,
                        "Yoga",
                        30,
                        null,
                        null,
                        null,
                        "   "));

        assertThat(response.steps()).isNull();
        assertThat(response.distanceKm()).isNull();
        assertThat(response.reportedCaloriesBurned()).isNull();
        assertThat(response.notes()).isNull();
    }

    @Test
    void retrievesSelectedDateEntriesInRepositoryOrderAndRetrievesOwnedEntry() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate activityDate = LocalDate.now();
        ActivityEntry first = createEntry(profile, 1L, activityDate, 20, 1_000, null, null);
        ActivityEntry second = createEntry(profile, 2L, activityDate, 30, 2_000, null, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
                1L, activityDate)).thenReturn(List.of(first, second));
        when(activityEntryRepository.findByIdAndUserProfileId(2L, 1L)).thenReturn(Optional.of(second));

        List<ActivityEntryResponse> entries = activityTrackingService.getActivityEntries(1L, activityDate);
        ActivityEntryResponse owned = activityTrackingService.getActivityEntry(1L, 2L);

        assertThat(entries).extracting(ActivityEntryResponse::id).containsExactly(1L, 2L);
        assertThat(owned.id()).isEqualTo(2L);
        verify(activityEntryRepository)
                .findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(1L, activityDate);
    }

    @Test
    void updatesOwnedActivityWhilePreservingIdentityOwnerAndCreatedAt() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDateTime createdAt = LocalDateTime.now().minusDays(1);
        ActivityEntry entry = createEntry(profile, 5L, LocalDate.now().minusDays(1), 20, null, null, null);
        entry.setCreatedAt(createdAt);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.findByIdAndUserProfileId(5L, 1L)).thenReturn(Optional.of(entry));
        when(activityEntryRepository.save(entry)).thenReturn(entry);

        ActivityEntryResponse response = activityTrackingService.updateActivityEntry(
                1L,
                5L,
                new ActivityEntryRequest(
                        LocalDate.now(),
                        ActivityCategory.CYCLING,
                        "  Cycling  ",
                        60,
                        0,
                        new BigDecimal("20.125"),
                        500,
                        "  Updated  "));

        assertThat(entry.getId()).isEqualTo(5L);
        assertThat(entry.getUserProfile()).isSameAs(profile);
        assertThat(entry.getCreatedAt()).isEqualTo(createdAt);
        assertThat(response.activityName()).isEqualTo("Cycling");
        assertThat(response.category()).isEqualTo(ActivityCategory.CYCLING);
        assertThat(response.notes()).isEqualTo("Updated");
    }

    @Test
    void deletesOnlyOwnedActivity() {
        UserProfile profile = createProfile(1L, "Husband");
        ActivityEntry entry = createEntry(profile, 5L, LocalDate.now(), 20, null, null, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.findByIdAndUserProfileId(5L, 1L)).thenReturn(Optional.of(entry));

        activityTrackingService.deleteActivityEntry(1L, 5L);

        verify(activityEntryRepository).delete(entry);
    }

    @Test
    void rejectsCrossProfileRetrieveUpdateAndDeleteAsNotFound() {
        UserProfile wife = createProfile(2L, "Wife");
        when(userProfileRepository.findById(2L)).thenReturn(Optional.of(wife));
        when(activityEntryRepository.findByIdAndUserProfileId(5L, 2L)).thenReturn(Optional.empty());
        ActivityEntryRequest request = validRequest();

        assertThatThrownBy(() -> activityTrackingService.getActivityEntry(2L, 5L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Activity entry not found with id: 5");
        assertThatThrownBy(() -> activityTrackingService.updateActivityEntry(2L, 5L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Activity entry not found with id: 5");
        assertThatThrownBy(() -> activityTrackingService.deleteActivityEntry(2L, 5L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Activity entry not found with id: 5");
        verify(activityEntryRepository, never()).findById(5L);
        verify(activityEntryRepository, never()).delete(any(ActivityEntry.class));
    }

    @Test
    void rejectsMissingProfileAndMissingActivity() {
        when(userProfileRepository.findById(999L)).thenReturn(Optional.empty());
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));
        when(activityEntryRepository.findByIdAndUserProfileId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityTrackingService.createActivityEntry(999L, validRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User profile not found with id: 999");
        assertThatThrownBy(() -> activityTrackingService.getActivityEntry(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Activity entry not found with id: 999");
    }

    @Test
    void rejectsNullAndFutureSelectedDatesWithoutDefaulting() {
        assertThatThrownBy(() -> activityTrackingService.getActivityEntries(1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Activity date is required");
        assertThatThrownBy(() -> activityTrackingService.getDailyActivitySummary(
                1L, LocalDate.now().plusDays(1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Activity date must not be in the future");
    }

    @Test
    void rejectsMissingRequestDateCategoryAndInvalidActivityNames() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));

        assertInvalid(null, "Activity entry request is required");
        assertInvalid(request(null, ActivityCategory.WALKING, "Walk", 30, null, null, null, null),
                "Activity date is required");
        assertInvalid(request(LocalDate.now().plusDays(1), ActivityCategory.WALKING, "Walk", 30,
                        null, null, null, null),
                "Activity date must not be in the future");
        assertInvalid(request(LocalDate.now(), null, "Walk", 30, null, null, null, null),
                "Activity category is required");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "   ", 30,
                        null, null, null, null),
                "Activity name is required");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "a".repeat(101), 30,
                        null, null, null, null),
                "Activity name must not exceed 100 characters");
        verify(activityEntryRepository, never()).save(any(ActivityEntry.class));
    }

    @Test
    void rejectsInvalidDurationStepsAndReportedCaloriesBoundaries() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));

        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 0,
                        null, null, null, null),
                "Duration minutes must be between 1 and 1440");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 1441,
                        null, null, null, null),
                "Duration minutes must be between 1 and 1440");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        -1, null, null, null),
                "Steps must be between 0 and 1000000");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        1_000_001, null, null, null),
                "Steps must be between 0 and 1000000");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        null, null, -1, null),
                "Reported calories burned must be between 0 and 100000");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        null, null, 100_001, null),
                "Reported calories burned must be between 0 and 100000");
    }

    @Test
    void rejectsInvalidDistancePrecisionAndBoundsAndLongNotes() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L, "Husband")));

        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        null, new BigDecimal("-0.001"), null, null),
                "Distance must be between 0 and 10000.000 kilometres");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        null, new BigDecimal("10000.001"), null, null),
                "Distance must be between 0 and 10000.000 kilometres");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        null, new BigDecimal("1.2345"), null, null),
                "Distance must not have more than 3 fractional digits");
        assertInvalid(request(LocalDate.now(), ActivityCategory.WALKING, "Walk", 30,
                        null, null, null, "n".repeat(501)),
                "Notes must not exceed 500 characters");
    }

    @Test
    void returnsEmptyDaySummaryWithUnavailableOptionalTotals() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate activityDate = LocalDate.now();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
                1L, activityDate)).thenReturn(List.of());

        DailyActivitySummary summary = activityTrackingService.getDailyActivitySummary(1L, activityDate);

        assertThat(summary.userProfileId()).isEqualTo(1L);
        assertThat(summary.activityDate()).isEqualTo(activityDate);
        assertThat(summary.activityCount()).isZero();
        assertThat(summary.totalDurationMinutes()).isZero();
        assertThat(summary.reportedSteps()).isNull();
        assertThat(summary.reportedDistanceKm()).isNull();
        assertThat(summary.reportedCaloriesBurned()).isNull();
    }

    @Test
    void aggregatesDurationWithLongArithmeticAndLeavesAllUnreportedMeasurementsNull() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate activityDate = LocalDate.now();
        ActivityEntry first = createEntry(profile, 1L, activityDate, Integer.MAX_VALUE, null, null, null);
        ActivityEntry second = createEntry(profile, 2L, activityDate, Integer.MAX_VALUE, null, null, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
                1L, activityDate)).thenReturn(List.of(first, second));

        DailyActivitySummary summary = activityTrackingService.getDailyActivitySummary(1L, activityDate);

        assertThat(summary.activityCount()).isEqualTo(2);
        assertThat(summary.totalDurationMinutes()).isEqualTo(4_294_967_294L);
        assertThat(summary.reportedSteps()).isNull();
        assertThat(summary.reportedDistanceKm()).isNull();
        assertThat(summary.reportedCaloriesBurned()).isNull();
    }

    @Test
    void preservesExplicitZeroOptionalMeasurements() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate activityDate = LocalDate.now();
        ActivityEntry entry = createEntry(
                profile, 1L, activityDate, 30, 0, new BigDecimal("0.000"), 0);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
                1L, activityDate)).thenReturn(List.of(entry));

        DailyActivitySummary summary = activityTrackingService.getDailyActivitySummary(1L, activityDate);

        assertThat(summary.reportedSteps()).isZero();
        assertThat(summary.reportedDistanceKm()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.reportedDistanceKm().scale()).isEqualTo(3);
        assertThat(summary.reportedCaloriesBurned()).isZero();
    }

    @Test
    void aggregatesOnlyReportedOptionalMeasurementsWithoutConvertingNullsToZero() {
        UserProfile profile = createProfile(1L, "Husband");
        LocalDate activityDate = LocalDate.now();
        ActivityEntry unavailable = createEntry(profile, 1L, activityDate, 20, null, null, null);
        ActivityEntry first = createEntry(
                profile, 2L, activityDate, 30, 1_000, new BigDecimal("1.125"), 100);
        ActivityEntry second = createEntry(
                profile, 3L, activityDate, 40, 2_000, new BigDecimal("2.250"), 200);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(activityEntryRepository.findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
                1L, activityDate)).thenReturn(List.of(unavailable, first, second));

        DailyActivitySummary summary = activityTrackingService.getDailyActivitySummary(1L, activityDate);

        assertThat(summary.totalDurationMinutes()).isEqualTo(90L);
        assertThat(summary.reportedSteps()).isEqualTo(3_000L);
        assertThat(summary.reportedDistanceKm()).isEqualByComparingTo("3.375");
        assertThat(summary.reportedCaloriesBurned()).isEqualTo(300L);
    }

    @Test
    void keepsHusbandAndWifeActivityDataIsolated() {
        UserProfile husband = createProfile(1L, "Husband");
        UserProfile wife = createProfile(2L, "Wife");
        LocalDate activityDate = LocalDate.now();
        ActivityEntry husbandEntry = createEntry(husband, 1L, activityDate, 30, 3_000, null, null);
        ActivityEntry wifeEntry = createEntry(wife, 2L, activityDate, 45, 5_000, null, null);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(husband));
        when(userProfileRepository.findById(2L)).thenReturn(Optional.of(wife));
        when(activityEntryRepository.findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
                1L, activityDate)).thenReturn(List.of(husbandEntry));
        when(activityEntryRepository.findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
                2L, activityDate)).thenReturn(List.of(wifeEntry));

        DailyActivitySummary husbandSummary = activityTrackingService.getDailyActivitySummary(1L, activityDate);
        DailyActivitySummary wifeSummary = activityTrackingService.getDailyActivitySummary(2L, activityDate);

        assertThat(husbandSummary.userProfileId()).isEqualTo(1L);
        assertThat(husbandSummary.reportedSteps()).isEqualTo(3_000L);
        assertThat(wifeSummary.userProfileId()).isEqualTo(2L);
        assertThat(wifeSummary.reportedSteps()).isEqualTo(5_000L);
        verify(activityEntryRepository)
                .findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(1L, activityDate);
        verify(activityEntryRepository)
                .findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(2L, activityDate);
    }

    private void assertInvalid(ActivityEntryRequest request, String expectedMessage) {
        assertThatThrownBy(() -> activityTrackingService.createActivityEntry(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(expectedMessage);
    }

    private ActivityEntryRequest validRequest() {
        return request(
                LocalDate.now(),
                ActivityCategory.WALKING,
                "Walk",
                30,
                null,
                null,
                null,
                null);
    }

    private ActivityEntryRequest request(
            LocalDate activityDate,
            ActivityCategory category,
            String activityName,
            Integer durationMinutes,
            Integer steps,
            BigDecimal distanceKm,
            Integer reportedCaloriesBurned,
            String notes) {
        return new ActivityEntryRequest(
                activityDate,
                category,
                activityName,
                durationMinutes,
                steps,
                distanceKm,
                reportedCaloriesBurned,
                notes);
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

    private ActivityEntry createEntry(
            UserProfile profile,
            Long id,
            LocalDate activityDate,
            Integer durationMinutes,
            Integer steps,
            BigDecimal distanceKm,
            Integer reportedCaloriesBurned) {
        LocalDateTime timestamp = LocalDateTime.now();
        ActivityEntry entry = new ActivityEntry();
        entry.setId(id);
        entry.setUserProfile(profile);
        entry.setActivityDate(activityDate);
        entry.setCategory(ActivityCategory.WALKING);
        entry.setActivityName("Walk");
        entry.setDurationMinutes(durationMinutes);
        entry.setSteps(steps);
        entry.setDistanceKm(distanceKm);
        entry.setReportedCaloriesBurned(reportedCaloriesBurned);
        entry.setCreatedAt(timestamp);
        entry.setUpdatedAt(timestamp);
        return entry;
    }
}
