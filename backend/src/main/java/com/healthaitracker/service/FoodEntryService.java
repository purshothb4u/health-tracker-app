package com.healthaitracker.service;

import com.healthaitracker.dto.DailyNutritionSummary;
import com.healthaitracker.dto.DailyTargetsResponse;
import com.healthaitracker.dto.FoodEntryRequest;
import com.healthaitracker.dto.FoodEntryResponse;
import com.healthaitracker.entity.FoodEntry;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.FoodEntryRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class FoodEntryService {

    private static final BigDecimal ZERO_NUTRITION = new BigDecimal("0.00");

    private final FoodEntryRepository foodEntryRepository;
    private final UserProfileRepository userProfileRepository;
    private final DailyTargetCalculationService dailyTargetCalculationService;

    public FoodEntryService(
            FoodEntryRepository foodEntryRepository,
            UserProfileRepository userProfileRepository,
            DailyTargetCalculationService dailyTargetCalculationService) {
        this.foodEntryRepository = foodEntryRepository;
        this.userProfileRepository = userProfileRepository;
        this.dailyTargetCalculationService = dailyTargetCalculationService;
    }

    public List<FoodEntryResponse> getFoodEntries(Long userProfileId, LocalDate entryDate) {
        findUserProfileOrThrow(userProfileId);
        return foodEntryRepository.findByUserProfileIdAndEntryDateOrdered(userProfileId, entryDate).stream()
                .map(FoodEntryResponse::fromEntity)
                .toList();
    }

    public FoodEntryResponse getFoodEntry(Long userProfileId, Long foodEntryId) {
        return FoodEntryResponse.fromEntity(findFoodEntryForUserOrThrow(userProfileId, foodEntryId));
    }

    public DailyNutritionSummary getDailyNutritionSummary(Long userProfileId, LocalDate entryDate) {
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        List<FoodEntry> foodEntries = foodEntryRepository
                .findByUserProfileIdAndEntryDateOrdered(userProfileId, entryDate);

        BigDecimal totalCalories = sum(foodEntries, FoodEntry::getCalories);
        BigDecimal totalProteinGrams = sum(foodEntries, FoodEntry::getProteinG);
        BigDecimal totalCarbohydrateGrams = sum(foodEntries, FoodEntry::getCarbohydratesG);
        BigDecimal totalFatGrams = sum(foodEntries, FoodEntry::getFatG);
        DailyTargetsResponse dailyTargets = dailyTargetCalculationService.calculateForProfile(profile);
        BigDecimal maintenanceCalories = dailyTargets.estimatedMaintenanceKcal();
        BigDecimal remainingCalories = maintenanceCalories == null
                ? null
                : maintenanceCalories.subtract(totalCalories);

        return new DailyNutritionSummary(
                userProfileId,
                entryDate,
                totalCalories,
                totalProteinGrams,
                totalCarbohydrateGrams,
                totalFatGrams,
                maintenanceCalories,
                remainingCalories
        );
    }

    @Transactional
    public FoodEntryResponse createFoodEntry(Long userProfileId, FoodEntryRequest request) {
        UserProfile profile = findUserProfileOrThrow(userProfileId);
        FoodEntry foodEntry = new FoodEntry();
        foodEntry.setUserProfile(profile);
        applyRequest(foodEntry, request);
        return FoodEntryResponse.fromEntity(foodEntryRepository.save(foodEntry));
    }

    @Transactional
    public FoodEntryResponse updateFoodEntry(Long userProfileId, Long foodEntryId, FoodEntryRequest request) {
        FoodEntry foodEntry = findFoodEntryForUserOrThrow(userProfileId, foodEntryId);
        applyRequest(foodEntry, request);
        return FoodEntryResponse.fromEntity(foodEntryRepository.save(foodEntry));
    }

    @Transactional
    public void deleteFoodEntry(Long userProfileId, Long foodEntryId) {
        foodEntryRepository.delete(findFoodEntryForUserOrThrow(userProfileId, foodEntryId));
    }

    private UserProfile findUserProfileOrThrow(Long userProfileId) {
        return userProfileRepository.findById(userProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User profile not found with id: " + userProfileId));
    }

    private FoodEntry findFoodEntryForUserOrThrow(Long userProfileId, Long foodEntryId) {
        findUserProfileOrThrow(userProfileId);
        FoodEntry foodEntry = foodEntryRepository.findById(foodEntryId)
                .orElseThrow(() -> new ResourceNotFoundException("Food entry not found with id: " + foodEntryId));
        if (!foodEntry.getUserProfile().getId().equals(userProfileId)) {
            throw new ResourceNotFoundException("Food entry not found with id: " + foodEntryId);
        }
        return foodEntry;
    }

    private BigDecimal sum(List<FoodEntry> foodEntries, java.util.function.Function<FoodEntry, BigDecimal> valueExtractor) {
        return foodEntries.stream()
                .map(valueExtractor)
                .reduce(ZERO_NUTRITION, BigDecimal::add);
    }

    private void applyRequest(FoodEntry foodEntry, FoodEntryRequest request) {
        foodEntry.setEntryDate(request.entryDate());
        foodEntry.setMealType(request.mealType());
        foodEntry.setFoodName(request.foodName());
        foodEntry.setQuantity(request.quantity());
        foodEntry.setUnit(request.unit());
        foodEntry.setCalories(request.calories());
        foodEntry.setProteinG(request.proteinGrams());
        foodEntry.setCarbohydratesG(request.carbohydrateGrams());
        foodEntry.setFatG(request.fatGrams());
        foodEntry.setNotes(request.notes());
    }
}
