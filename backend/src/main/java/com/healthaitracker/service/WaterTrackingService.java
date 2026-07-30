package com.healthaitracker.service;

import com.healthaitracker.dto.HydrationSummary;
import com.healthaitracker.dto.WaterEntryRequest;
import com.healthaitracker.dto.WaterEntryResponse;
import com.healthaitracker.dto.WaterGoalRequest;
import com.healthaitracker.dto.WaterGoalResponse;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.entity.WaterEntry;
import com.healthaitracker.entity.WaterGoal;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.repository.WaterEntryRepository;
import com.healthaitracker.repository.WaterGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class WaterTrackingService {

    private static final int MAXIMUM_NOTES_LENGTH = 500;
    private static final int PERCENTAGE_SCALE = 1;
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final WaterEntryRepository waterEntryRepository;
    private final WaterGoalRepository waterGoalRepository;
    private final UserProfileRepository userProfileRepository;

    public WaterTrackingService(
            WaterEntryRepository waterEntryRepository,
            WaterGoalRepository waterGoalRepository,
            UserProfileRepository userProfileRepository) {
        this.waterEntryRepository = waterEntryRepository;
        this.waterGoalRepository = waterGoalRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public List<WaterEntryResponse> getWaterEntries(Long userProfileId, LocalDate entryDate) {
        validateEntryDate(entryDate);
        findUserProfileOrThrow(userProfileId);
        return waterEntryRepository.findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(userProfileId, entryDate)
                .stream()
                .map(this::toWaterEntryResponse)
                .toList();
    }

    public WaterEntryResponse getWaterEntry(Long userProfileId, Long waterEntryId) {
        return toWaterEntryResponse(findWaterEntryForUserOrThrow(userProfileId, waterEntryId));
    }

    public WaterGoalResponse getWaterGoal(Long userProfileId) {
        findUserProfileOrThrow(userProfileId);
        return waterGoalRepository.findByUserProfileId(userProfileId)
                .map(this::toWaterGoalResponse)
                .orElseGet(() -> new WaterGoalResponse(userProfileId, null, null, null));
    }

    public HydrationSummary getHydrationSummary(Long userProfileId, LocalDate entryDate) {
        validateEntryDate(entryDate);
        findUserProfileOrThrow(userProfileId);
        List<WaterEntry> entries = waterEntryRepository
                .findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(userProfileId, entryDate);
        long totalConsumedMl = entries.stream()
                .mapToLong(entry -> entry.getAmountMl().longValue())
                .sum();

        return waterGoalRepository.findByUserProfileId(userProfileId)
                .map(goal -> hydrationSummaryWithGoal(entryDate, totalConsumedMl, entries.size(), goal))
                .orElseGet(() -> new HydrationSummary(
                        entryDate,
                        totalConsumedMl,
                        entries.size(),
                        null,
                        null,
                        null,
                        null,
                        null
                ));
    }

    @Transactional
    public WaterEntryResponse createWaterEntry(Long userProfileId, WaterEntryRequest request) {
        validateWaterEntryRequest(request);
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        WaterEntry entry = new WaterEntry();
        entry.setUserProfile(profile);
        applyWaterEntryRequest(entry, request);
        return toWaterEntryResponse(waterEntryRepository.save(entry));
    }

    @Transactional
    public WaterEntryResponse updateWaterEntry(Long userProfileId, Long waterEntryId, WaterEntryRequest request) {
        validateWaterEntryRequest(request);
        WaterEntry entry = findWaterEntryForUserOrThrow(userProfileId, waterEntryId);
        applyWaterEntryRequest(entry, request);
        return toWaterEntryResponse(waterEntryRepository.save(entry));
    }

    @Transactional
    public void deleteWaterEntry(Long userProfileId, Long waterEntryId) {
        waterEntryRepository.delete(findWaterEntryForUserOrThrow(userProfileId, waterEntryId));
    }

    @Transactional
    public WaterGoalResponse updateWaterGoal(Long userProfileId, WaterGoalRequest request) {
        validateWaterGoalRequest(request);
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        WaterGoal goal = waterGoalRepository.findByUserProfileId(userProfileId)
                .orElseGet(() -> {
                    WaterGoal newGoal = new WaterGoal();
                    newGoal.setUserProfile(profile);
                    return newGoal;
                });
        goal.setDailyGoalMl(request.dailyGoalMl());
        return toWaterGoalResponse(waterGoalRepository.save(goal));
    }

    private HydrationSummary hydrationSummaryWithGoal(
            LocalDate entryDate,
            long totalConsumedMl,
            int entryCount,
            WaterGoal goal) {
        long currentGoalMl = goal.getDailyGoalMl().longValue();
        return new HydrationSummary(
                entryDate,
                totalConsumedMl,
                entryCount,
                goal.getDailyGoalMl(),
                Math.max(currentGoalMl - totalConsumedMl, 0L),
                Math.max(totalConsumedMl - currentGoalMl, 0L),
                BigDecimal.valueOf(totalConsumedMl)
                        .multiply(ONE_HUNDRED)
                        .divide(BigDecimal.valueOf(currentGoalMl), PERCENTAGE_SCALE, RoundingMode.HALF_UP),
                totalConsumedMl >= currentGoalMl
        );
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private WaterEntry findWaterEntryForUserOrThrow(Long userProfileId, Long waterEntryId) {
        findUserProfileOrThrow(userProfileId);
        return waterEntryRepository.findByIdAndUserProfileId(waterEntryId, userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Water entry not found with id: " + waterEntryId));
    }

    private void validateWaterEntryRequest(WaterEntryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Water entry request is required");
        }
        validateEntryDate(request.entryDate());
        if (request.amountMl() == null || request.amountMl() <= 0) {
            throw new IllegalArgumentException("Water amount must be positive");
        }
        if (request.notes() != null && request.notes().length() > MAXIMUM_NOTES_LENGTH) {
            throw new IllegalArgumentException("Notes must not exceed 500 characters");
        }
    }

    private void validateWaterGoalRequest(WaterGoalRequest request) {
        if (request == null || request.dailyGoalMl() == null || request.dailyGoalMl() <= 0) {
            throw new IllegalArgumentException("Daily water goal must be positive");
        }
    }

    private void validateEntryDate(LocalDate entryDate) {
        if (entryDate == null) {
            throw new IllegalArgumentException("Entry date is required");
        }
        if (entryDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Entry date must not be in the future");
        }
    }

    private void applyWaterEntryRequest(WaterEntry entry, WaterEntryRequest request) {
        entry.setEntryDate(request.entryDate());
        entry.setAmountMl(request.amountMl());
        entry.setNotes(request.notes());
    }

    private WaterEntryResponse toWaterEntryResponse(WaterEntry entry) {
        return new WaterEntryResponse(
                entry.getId(),
                entry.getUserProfile().getId(),
                entry.getEntryDate(),
                entry.getAmountMl(),
                entry.getNotes(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }

    private WaterGoalResponse toWaterGoalResponse(WaterGoal goal) {
        return new WaterGoalResponse(
                goal.getUserProfile().getId(),
                goal.getDailyGoalMl(),
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }
}
