package com.healthaitracker.service;

import com.healthaitracker.dto.ActivityEntryRequest;
import com.healthaitracker.dto.ActivityEntryResponse;
import com.healthaitracker.dto.DailyActivitySummary;
import com.healthaitracker.entity.ActivityEntry;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.ActivityEntryRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ActivityTrackingService {

    private static final int MAXIMUM_ACTIVITY_NAME_LENGTH = 100;
    private static final int MAXIMUM_DURATION_MINUTES = 1440;
    private static final int MAXIMUM_STEPS = 1_000_000;
    private static final BigDecimal MAXIMUM_DISTANCE_KM = new BigDecimal("10000.000");
    private static final int MAXIMUM_REPORTED_CALORIES_BURNED = 100_000;
    private static final int MAXIMUM_NOTES_LENGTH = 500;
    private static final int MAXIMUM_DISTANCE_SCALE = 3;

    private final ActivityEntryRepository activityEntryRepository;
    private final UserProfileRepository userProfileRepository;

    public ActivityTrackingService(
            ActivityEntryRepository activityEntryRepository,
            UserProfileRepository userProfileRepository) {
        this.activityEntryRepository = activityEntryRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public ActivityEntryResponse createActivityEntry(Long userProfileId, ActivityEntryRequest request) {
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        validateActivityEntryRequest(request);
        ActivityEntry entry = new ActivityEntry();
        entry.setUserProfile(profile);
        applyActivityEntryRequest(entry, request);
        return toActivityEntryResponse(activityEntryRepository.save(entry));
    }

    public List<ActivityEntryResponse> getActivityEntries(Long userProfileId, LocalDate activityDate) {
        validateActivityDate(activityDate);
        findUserProfileOrThrow(userProfileId);
        return activityEntryRepository
                .findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(userProfileId, activityDate)
                .stream()
                .map(this::toActivityEntryResponse)
                .toList();
    }

    public ActivityEntryResponse getActivityEntry(Long userProfileId, Long activityEntryId) {
        return toActivityEntryResponse(findActivityEntryForUserOrThrow(userProfileId, activityEntryId));
    }

    @Transactional
    public ActivityEntryResponse updateActivityEntry(
            Long userProfileId,
            Long activityEntryId,
            ActivityEntryRequest request) {
        ActivityEntry entry = findActivityEntryForUserOrThrow(userProfileId, activityEntryId);
        validateActivityEntryRequest(request);
        applyActivityEntryRequest(entry, request);
        return toActivityEntryResponse(activityEntryRepository.save(entry));
    }

    @Transactional
    public void deleteActivityEntry(Long userProfileId, Long activityEntryId) {
        activityEntryRepository.delete(findActivityEntryForUserOrThrow(userProfileId, activityEntryId));
    }

    public DailyActivitySummary getDailyActivitySummary(Long userProfileId, LocalDate activityDate) {
        validateActivityDate(activityDate);
        findUserProfileOrThrow(userProfileId);
        List<ActivityEntry> entries = activityEntryRepository
                .findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(userProfileId, activityDate);

        long totalDurationMinutes = 0L;
        long reportedSteps = 0L;
        BigDecimal reportedDistanceKm = BigDecimal.ZERO;
        long reportedCaloriesBurned = 0L;
        boolean hasReportedSteps = false;
        boolean hasReportedDistance = false;
        boolean hasReportedCalories = false;

        for (ActivityEntry entry : entries) {
            totalDurationMinutes += entry.getDurationMinutes().longValue();
            if (entry.getSteps() != null) {
                reportedSteps += entry.getSteps().longValue();
                hasReportedSteps = true;
            }
            if (entry.getDistanceKm() != null) {
                reportedDistanceKm = reportedDistanceKm.add(entry.getDistanceKm());
                hasReportedDistance = true;
            }
            if (entry.getReportedCaloriesBurned() != null) {
                reportedCaloriesBurned += entry.getReportedCaloriesBurned().longValue();
                hasReportedCalories = true;
            }
        }

        return new DailyActivitySummary(
                userProfileId,
                activityDate,
                entries.size(),
                totalDurationMinutes,
                hasReportedSteps ? reportedSteps : null,
                hasReportedDistance ? reportedDistanceKm : null,
                hasReportedCalories ? reportedCaloriesBurned : null
        );
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private ActivityEntry findActivityEntryForUserOrThrow(Long userProfileId, Long activityEntryId) {
        findUserProfileOrThrow(userProfileId);
        return activityEntryRepository.findByIdAndUserProfileId(activityEntryId, userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity entry not found with id: " + activityEntryId));
    }

    private void validateActivityEntryRequest(ActivityEntryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Activity entry request is required");
        }
        validateActivityDate(request.activityDate());
        if (request.category() == null) {
            throw new IllegalArgumentException("Activity category is required");
        }
        validateActivityName(request.activityName());
        if (request.durationMinutes() == null
                || request.durationMinutes() < 1
                || request.durationMinutes() > MAXIMUM_DURATION_MINUTES) {
            throw new IllegalArgumentException("Duration minutes must be between 1 and 1440");
        }
        if (request.steps() != null && (request.steps() < 0 || request.steps() > MAXIMUM_STEPS)) {
            throw new IllegalArgumentException("Steps must be between 0 and 1000000");
        }
        validateDistance(request.distanceKm());
        if (request.reportedCaloriesBurned() != null
                && (request.reportedCaloriesBurned() < 0
                || request.reportedCaloriesBurned() > MAXIMUM_REPORTED_CALORIES_BURNED)) {
            throw new IllegalArgumentException("Reported calories burned must be between 0 and 100000");
        }
        if (request.notes() != null && request.notes().length() > MAXIMUM_NOTES_LENGTH) {
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
    }

    private void validateActivityName(String activityName) {
        if (activityName == null || activityName.trim().isEmpty()) {
            throw new IllegalArgumentException("Activity name is required");
        }
        if (activityName.length() > MAXIMUM_ACTIVITY_NAME_LENGTH) {
            throw new IllegalArgumentException("Activity name must not exceed 100 characters");
        }
    }

    private void validateDistance(BigDecimal distanceKm) {
        if (distanceKm == null) {
            return;
        }
        if (distanceKm.compareTo(BigDecimal.ZERO) < 0
                || distanceKm.compareTo(MAXIMUM_DISTANCE_KM) > 0) {
            throw new IllegalArgumentException("Distance must be between 0 and 10000.000 kilometres");
        }
        if (distanceKm.scale() > MAXIMUM_DISTANCE_SCALE) {
            throw new IllegalArgumentException("Distance must not have more than 3 fractional digits");
        }
    }

    private void validateActivityDate(LocalDate activityDate) {
        if (activityDate == null) {
            throw new IllegalArgumentException("Activity date is required");
        }
        if (activityDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Activity date must not be in the future");
        }
    }

    private void applyActivityEntryRequest(ActivityEntry entry, ActivityEntryRequest request) {
        entry.setActivityDate(request.activityDate());
        entry.setCategory(request.category());
        entry.setActivityName(request.activityName().trim());
        entry.setDurationMinutes(request.durationMinutes());
        entry.setSteps(request.steps());
        entry.setDistanceKm(request.distanceKm());
        entry.setReportedCaloriesBurned(request.reportedCaloriesBurned());
        entry.setNotes(normalizeNotes(request.notes()));
    }

    private String normalizeNotes(String notes) {
        if (notes == null) {
            return null;
        }
        String trimmedNotes = notes.trim();
        return trimmedNotes.isEmpty() ? null : trimmedNotes;
    }

    private ActivityEntryResponse toActivityEntryResponse(ActivityEntry entry) {
        return new ActivityEntryResponse(
                entry.getId(),
                entry.getUserProfile().getId(),
                entry.getActivityDate(),
                entry.getCategory(),
                entry.getActivityName(),
                entry.getDurationMinutes(),
                entry.getSteps(),
                entry.getDistanceKm(),
                entry.getReportedCaloriesBurned(),
                entry.getNotes(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
