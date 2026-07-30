package com.healthaitracker.service;

import com.healthaitracker.dto.HydrationSummary;
import com.healthaitracker.dto.WaterEntryRequest;
import com.healthaitracker.dto.WaterEntryResponse;
import com.healthaitracker.dto.WaterGoalRequest;
import com.healthaitracker.dto.WaterGoalResponse;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.entity.WaterEntry;
import com.healthaitracker.entity.WaterGoal;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.repository.WaterEntryRepository;
import com.healthaitracker.repository.WaterGoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WaterTrackingServiceTest {

    @Mock
    private WaterEntryRepository waterEntryRepository;

    @Mock
    private WaterGoalRepository waterGoalRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    private WaterTrackingService waterTrackingService;

    @BeforeEach
    void setUp() {
        waterTrackingService = new WaterTrackingService(
                waterEntryRepository,
                waterGoalRepository,
                userProfileRepository);
    }

    @Test
    void createsWaterEntryForExistingProfile() {
        UserProfile profile = createProfile(1L);
        LocalDate entryDate = LocalDate.now();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterEntryRepository.save(any(WaterEntry.class))).thenAnswer(invocation -> {
            WaterEntry entry = invocation.getArgument(0, WaterEntry.class);
            entry.setId(10L);
            entry.setCreatedAt(LocalDateTime.now());
            entry.setUpdatedAt(LocalDateTime.now());
            return entry;
        });

        WaterEntryResponse response = waterTrackingService.createWaterEntry(
                1L, new WaterEntryRequest(entryDate, 500, "Morning water"));

        ArgumentCaptor<WaterEntry> entryCaptor = ArgumentCaptor.forClass(WaterEntry.class);
        verify(waterEntryRepository).save(entryCaptor.capture());
        assertThat(entryCaptor.getValue().getUserProfile()).isSameAs(profile);
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.amountMl()).isEqualTo(500);
        assertThat(response.entryDate()).isEqualTo(entryDate);
    }

    @Test
    void retrievesSelectedDateEntriesInRepositoryOrder() {
        UserProfile profile = createProfile(1L);
        LocalDate entryDate = LocalDate.now();
        WaterEntry firstEntry = createEntry(profile, 1L, entryDate, 250, LocalDateTime.now().minusMinutes(2));
        WaterEntry secondEntry = createEntry(profile, 2L, entryDate, 500, LocalDateTime.now().minusMinutes(1));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(1L, entryDate))
                .thenReturn(List.of(firstEntry, secondEntry));

        List<WaterEntryResponse> entries = waterTrackingService.getWaterEntries(1L, entryDate);

        assertThat(entries).extracting(WaterEntryResponse::id).containsExactly(1L, 2L);
        assertThat(entries).extracting(WaterEntryResponse::amountMl).containsExactly(250, 500);
    }

    @Test
    void updatesAndDeletesOwnedWaterEntry() {
        UserProfile profile = createProfile(1L);
        LocalDate entryDate = LocalDate.now();
        WaterEntry entry = createEntry(profile, 5L, entryDate, 250, LocalDateTime.now());
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterEntryRepository.findByIdAndUserProfileId(5L, 1L)).thenReturn(Optional.of(entry));
        when(waterEntryRepository.save(entry)).thenReturn(entry);

        WaterEntryResponse updated = waterTrackingService.updateWaterEntry(
                1L, 5L, new WaterEntryRequest(entryDate, 750, "Updated"));
        waterTrackingService.deleteWaterEntry(1L, 5L);

        assertThat(updated.amountMl()).isEqualTo(750);
        assertThat(updated.notes()).isEqualTo("Updated");
        verify(waterEntryRepository).delete(entry);
    }

    @Test
    void rejectsCrossProfileEntryAccessWithoutLookingUpAnotherProfilesEntry() {
        UserProfile otherProfile = createProfile(2L);
        when(userProfileRepository.findById(2L)).thenReturn(Optional.of(otherProfile));
        when(waterEntryRepository.findByIdAndUserProfileId(5L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> waterTrackingService.getWaterEntry(2L, 5L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Water entry not found with id: 5");
        verify(waterEntryRepository, never()).findById(5L);
    }

    @Test
    void createsUpdatesAndRepeatsCurrentWaterGoalIdempotently() {
        UserProfile profile = createProfile(1L);
        WaterGoal existingGoal = createGoal(profile, 1L, 2000);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterGoalRepository.findByUserProfileId(1L))
                .thenReturn(Optional.empty(), Optional.of(existingGoal), Optional.of(existingGoal));
        when(waterGoalRepository.save(any(WaterGoal.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, WaterGoal.class));

        WaterGoalResponse created = waterTrackingService.updateWaterGoal(1L, new WaterGoalRequest(1800));
        WaterGoalResponse updated = waterTrackingService.updateWaterGoal(1L, new WaterGoalRequest(2000));
        WaterGoalResponse repeated = waterTrackingService.updateWaterGoal(1L, new WaterGoalRequest(2000));

        assertThat(created.dailyGoalMl()).isEqualTo(1800);
        assertThat(updated.dailyGoalMl()).isEqualTo(2000);
        assertThat(repeated.dailyGoalMl()).isEqualTo(2000);
        verify(waterGoalRepository, times(3)).save(any(WaterGoal.class));
    }

    @Test
    void calculatesBelowExactAndAboveGoalSummaries() {
        UserProfile profile = createProfile(1L);
        WaterGoal goal = createGoal(profile, 1L, 2000);
        LocalDate belowDate = LocalDate.now().minusDays(2);
        LocalDate exactDate = LocalDate.now().minusDays(1);
        LocalDate aboveDate = LocalDate.now();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterGoalRepository.findByUserProfileId(1L)).thenReturn(Optional.of(goal));
        when(waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(1L, belowDate))
                .thenReturn(List.of(createEntry(profile, 1L, belowDate, 1500, LocalDateTime.now())));
        when(waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(1L, exactDate))
                .thenReturn(List.of(createEntry(profile, 2L, exactDate, 2000, LocalDateTime.now())));
        when(waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(1L, aboveDate))
                .thenReturn(List.of(createEntry(profile, 3L, aboveDate, 2500, LocalDateTime.now())));

        HydrationSummary below = waterTrackingService.getHydrationSummary(1L, belowDate);
        HydrationSummary exact = waterTrackingService.getHydrationSummary(1L, exactDate);
        HydrationSummary above = waterTrackingService.getHydrationSummary(1L, aboveDate);

        assertThat(below.remainingAgainstCurrentGoalMl()).isEqualTo(500L);
        assertThat(below.excessAgainstCurrentGoalMl()).isZero();
        assertThat(below.progressAgainstCurrentGoalPercentage()).isEqualByComparingTo("75.0");
        assertThat(below.goalReached()).isFalse();
        assertThat(exact.remainingAgainstCurrentGoalMl()).isZero();
        assertThat(exact.excessAgainstCurrentGoalMl()).isZero();
        assertThat(exact.progressAgainstCurrentGoalPercentage()).isEqualByComparingTo("100.0");
        assertThat(exact.goalReached()).isTrue();
        assertThat(above.remainingAgainstCurrentGoalMl()).isZero();
        assertThat(above.excessAgainstCurrentGoalMl()).isEqualTo(500L);
        assertThat(above.progressAgainstCurrentGoalPercentage()).isEqualByComparingTo("125.0");
        assertThat(above.goalReached()).isTrue();
    }

    @Test
    void returnsEmptyDaySummaryWithConfiguredGoal() {
        UserProfile profile = createProfile(1L);
        WaterGoal goal = createGoal(profile, 1L, 1800);
        LocalDate entryDate = LocalDate.now();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(1L, entryDate))
                .thenReturn(List.of());
        when(waterGoalRepository.findByUserProfileId(1L)).thenReturn(Optional.of(goal));

        HydrationSummary summary = waterTrackingService.getHydrationSummary(1L, entryDate);

        assertThat(summary.totalConsumedMl()).isZero();
        assertThat(summary.entryCount()).isZero();
        assertThat(summary.remainingAgainstCurrentGoalMl()).isEqualTo(1800L);
        assertThat(summary.excessAgainstCurrentGoalMl()).isZero();
        assertThat(summary.progressAgainstCurrentGoalPercentage()).isEqualByComparingTo("0.0");
        assertThat(summary.goalReached()).isFalse();
    }

    @Test
    void returnsNullGoalDependentValuesWhenGoalIsNotConfigured() {
        UserProfile profile = createProfile(1L);
        LocalDate entryDate = LocalDate.now();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(1L, entryDate))
                .thenReturn(List.of(createEntry(profile, 1L, entryDate, 500, LocalDateTime.now())));
        when(waterGoalRepository.findByUserProfileId(1L)).thenReturn(Optional.empty());

        WaterGoalResponse goal = waterTrackingService.getWaterGoal(1L);
        HydrationSummary summary = waterTrackingService.getHydrationSummary(1L, entryDate);

        assertThat(goal.userProfileId()).isEqualTo(1L);
        assertThat(goal.dailyGoalMl()).isNull();
        assertThat(goal.createdAt()).isNull();
        assertThat(goal.updatedAt()).isNull();
        assertThat(summary.totalConsumedMl()).isEqualTo(500L);
        assertThat(summary.currentDailyGoalMl()).isNull();
        assertThat(summary.remainingAgainstCurrentGoalMl()).isNull();
        assertThat(summary.excessAgainstCurrentGoalMl()).isNull();
        assertThat(summary.progressAgainstCurrentGoalPercentage()).isNull();
        assertThat(summary.goalReached()).isNull();
    }

    @Test
    void sumsWaterEntryAmountsUsingLongArithmetic() {
        UserProfile profile = createProfile(1L);
        WaterGoal goal = createGoal(profile, 1L, 2_000_000_000);
        LocalDate entryDate = LocalDate.now();
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(1L, entryDate))
                .thenReturn(List.of(
                        createEntry(profile, 1L, entryDate, 2_000_000_000, LocalDateTime.now().minusMinutes(1)),
                        createEntry(profile, 2L, entryDate, 2_000_000_000, LocalDateTime.now())
                ));
        when(waterGoalRepository.findByUserProfileId(1L)).thenReturn(Optional.of(goal));

        HydrationSummary summary = waterTrackingService.getHydrationSummary(1L, entryDate);

        assertThat(summary.totalConsumedMl()).isEqualTo(4_000_000_000L);
        assertThat(summary.excessAgainstCurrentGoalMl()).isEqualTo(2_000_000_000L);
        assertThat(summary.progressAgainstCurrentGoalPercentage()).isEqualByComparingTo("200.0");
    }

    @Test
    void rejectsMissingProfilesAndMissingEntries() {
        when(userProfileRepository.findById(999L)).thenReturn(Optional.empty());
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(createProfile(1L)));
        when(waterEntryRepository.findByIdAndUserProfileId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> waterTrackingService.getWaterGoal(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User profile not found with id: 999");
        assertThatThrownBy(() -> waterTrackingService.getWaterEntry(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Water entry not found with id: 999");
    }

    @Test
    void rejectsFutureOrMissingDatesAndInvalidAmounts() {
        assertThatThrownBy(() -> waterTrackingService.getWaterEntries(1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Entry date is required");
        assertThatThrownBy(() -> waterTrackingService.getHydrationSummary(1L, LocalDate.now().plusDays(1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Entry date must not be in the future");
        assertThatThrownBy(() -> waterTrackingService.createWaterEntry(
                1L, new WaterEntryRequest(LocalDate.now(), 0, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Water amount must be positive");
        assertThatThrownBy(() -> waterTrackingService.updateWaterGoal(1L, new WaterGoalRequest(0)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Daily water goal must be positive");
    }

    private UserProfile createProfile(Long id) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setName("Water test profile");
        profile.setGender(Gender.OTHER);
        profile.setAge(30);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(70.0);
        profile.setCurrentWeightKg(70.0);
        profile.setTargetWeightKg(65.0);
        return profile;
    }

    private WaterEntry createEntry(
            UserProfile profile,
            Long id,
            LocalDate entryDate,
            Integer amountMl,
            LocalDateTime createdAt) {
        WaterEntry entry = new WaterEntry();
        entry.setId(id);
        entry.setUserProfile(profile);
        entry.setEntryDate(entryDate);
        entry.setAmountMl(amountMl);
        entry.setCreatedAt(createdAt);
        entry.setUpdatedAt(createdAt);
        return entry;
    }

    private WaterGoal createGoal(UserProfile profile, Long id, Integer dailyGoalMl) {
        WaterGoal goal = new WaterGoal();
        goal.setId(id);
        goal.setUserProfile(profile);
        goal.setDailyGoalMl(dailyGoalMl);
        goal.setCreatedAt(LocalDateTime.now().minusDays(1));
        goal.setUpdatedAt(LocalDateTime.now());
        return goal;
    }
}
