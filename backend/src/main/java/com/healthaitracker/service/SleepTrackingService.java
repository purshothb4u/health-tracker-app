package com.healthaitracker.service;

import com.healthaitracker.dto.DailySleepSummary;
import com.healthaitracker.dto.SleepEntryRequest;
import com.healthaitracker.dto.SleepEntryResponse;
import com.healthaitracker.entity.SleepEntry;
import com.healthaitracker.entity.SleepType;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.SleepEntryRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SleepTrackingService {

    private static final long MINIMUM_DURATION_MINUTES = 1L;
    private static final long MAXIMUM_DURATION_MINUTES = 1_440L;
    private static final int MINIMUM_QUALITY_RATING = 1;
    private static final int MAXIMUM_QUALITY_RATING = 5;
    private static final int MAXIMUM_NOTES_LENGTH = 500;
    private static final int AVERAGE_QUALITY_SCALE = 2;

    private final SleepEntryRepository sleepEntryRepository;
    private final UserProfileRepository userProfileRepository;
    private final Clock applicationClock;

    public SleepTrackingService(
            SleepEntryRepository sleepEntryRepository,
            UserProfileRepository userProfileRepository,
            Clock applicationClock) {
        this.sleepEntryRepository = sleepEntryRepository;
        this.userProfileRepository = userProfileRepository;
        this.applicationClock = applicationClock;
    }

    @Transactional
    public SleepEntryResponse createSleepEntry(Long userProfileId, SleepEntryRequest request) {
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        validateSleepEntryRequest(request);
        SleepEntry entry = new SleepEntry();
        entry.setUserProfile(profile);
        applySleepEntryRequest(entry, request);
        return toSleepEntryResponse(sleepEntryRepository.save(entry));
    }

    public List<SleepEntryResponse> getSleepEntries(Long userProfileId, LocalDate sleepDate) {
        validateSleepDate(sleepDate);
        findUserProfileOrThrow(userProfileId);
        return sleepEntryRepository
                .findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                        userProfileId,
                        sleepDate)
                .stream()
                .map(this::toSleepEntryResponse)
                .toList();
    }

    public SleepEntryResponse getSleepEntry(Long userProfileId, Long sleepEntryId) {
        return toSleepEntryResponse(findSleepEntryForUserOrThrow(userProfileId, sleepEntryId));
    }

    @Transactional
    public SleepEntryResponse updateSleepEntry(
            Long userProfileId,
            Long sleepEntryId,
            SleepEntryRequest request) {
        SleepEntry entry = findSleepEntryForUserOrThrow(userProfileId, sleepEntryId);
        validateSleepEntryRequest(request);
        applySleepEntryRequest(entry, request);
        return toSleepEntryResponse(sleepEntryRepository.save(entry));
    }

    @Transactional
    public void deleteSleepEntry(Long userProfileId, Long sleepEntryId) {
        sleepEntryRepository.delete(findSleepEntryForUserOrThrow(userProfileId, sleepEntryId));
    }

    public DailySleepSummary getDailySleepSummary(Long userProfileId, LocalDate sleepDate) {
        validateSleepDate(sleepDate);
        findUserProfileOrThrow(userProfileId);
        List<SleepEntry> entries = sleepEntryRepository
                .findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
                        userProfileId,
                        sleepDate);

        long totalSleepMinutes = 0L;
        long nightSleepMinutes = 0L;
        long napMinutes = 0L;
        long qualityTotal = 0L;
        long ratedSessionCount = 0L;

        for (SleepEntry entry : entries) {
            long durationMinutes = calculateDurationMinutes(entry.getStartDateTime(), entry.getEndDateTime());
            totalSleepMinutes += durationMinutes;
            if (entry.getSleepType() == SleepType.NIGHT_SLEEP) {
                nightSleepMinutes += durationMinutes;
            } else if (entry.getSleepType() == SleepType.NAP) {
                napMinutes += durationMinutes;
            }
            if (entry.getQualityRating() != null) {
                qualityTotal += entry.getQualityRating().longValue();
                ratedSessionCount++;
            }
        }

        BigDecimal averageQuality = ratedSessionCount == 0L
                ? null
                : BigDecimal.valueOf(qualityTotal)
                        .divide(
                                BigDecimal.valueOf(ratedSessionCount),
                                AVERAGE_QUALITY_SCALE,
                                RoundingMode.HALF_UP);

        return new DailySleepSummary(
                userProfileId,
                sleepDate,
                entries.size(),
                totalSleepMinutes,
                averageQuality,
                nightSleepMinutes,
                napMinutes
        );
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private SleepEntry findSleepEntryForUserOrThrow(Long userProfileId, Long sleepEntryId) {
        findUserProfileOrThrow(userProfileId);
        return sleepEntryRepository.findByIdAndUserProfileId(sleepEntryId, userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Sleep entry not found with id: " + sleepEntryId));
    }

    private void validateSleepEntryRequest(SleepEntryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Sleep entry request is required");
        }
        validateSleepDate(request.sleepDate());
        if (request.sleepType() == null) {
            throw new IllegalArgumentException("Sleep type is required");
        }
        if (request.startDateTime() == null) {
            throw new IllegalArgumentException("Start date and time are required");
        }
        if (request.endDateTime() == null) {
            throw new IllegalArgumentException("End date and time are required");
        }
        if (!request.endDateTime().isAfter(request.startDateTime())) {
            throw new IllegalArgumentException("End date and time must be after start date and time");
        }
        if (request.endDateTime().isAfter(LocalDateTime.now(applicationClock))) {
            throw new IllegalArgumentException("End date and time must not be in the future");
        }
        if (!request.sleepDate().equals(request.endDateTime().toLocalDate())) {
            throw new IllegalArgumentException("Sleep date must match the end date");
        }

        long durationMinutes = calculateDurationMinutes(request.startDateTime(), request.endDateTime());
        if (durationMinutes < MINIMUM_DURATION_MINUTES || durationMinutes > MAXIMUM_DURATION_MINUTES) {
            throw new IllegalArgumentException("Sleep duration must be between 1 and 1440 minutes");
        }
        if (request.qualityRating() != null
                && (request.qualityRating() < MINIMUM_QUALITY_RATING
                || request.qualityRating() > MAXIMUM_QUALITY_RATING)) {
            throw new IllegalArgumentException("Quality rating must be between 1 and 5");
        }
        if (request.notes() != null && request.notes().length() > MAXIMUM_NOTES_LENGTH) {
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
    }

    private void validateSleepDate(LocalDate sleepDate) {
        if (sleepDate == null) {
            throw new IllegalArgumentException("Sleep date is required");
        }
        if (sleepDate.isAfter(LocalDate.now(applicationClock))) {
            throw new IllegalArgumentException("Sleep date must not be in the future");
        }
    }

    private void applySleepEntryRequest(SleepEntry entry, SleepEntryRequest request) {
        entry.setSleepDate(request.sleepDate());
        entry.setSleepType(request.sleepType());
        entry.setStartDateTime(request.startDateTime());
        entry.setEndDateTime(request.endDateTime());
        entry.setQualityRating(request.qualityRating());
        entry.setNotes(normalizeNotes(request.notes()));
    }

    private String normalizeNotes(String notes) {
        if (notes == null) {
            return null;
        }
        String trimmedNotes = notes.trim();
        return trimmedNotes.isEmpty() ? null : trimmedNotes;
    }

    private long calculateDurationMinutes(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return Duration.between(startDateTime, endDateTime).toMinutes();
    }

    private SleepEntryResponse toSleepEntryResponse(SleepEntry entry) {
        return new SleepEntryResponse(
                entry.getId(),
                entry.getUserProfile().getId(),
                entry.getSleepDate(),
                entry.getSleepType(),
                entry.getStartDateTime(),
                entry.getEndDateTime(),
                calculateDurationMinutes(entry.getStartDateTime(), entry.getEndDateTime()),
                entry.getQualityRating(),
                entry.getNotes(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
