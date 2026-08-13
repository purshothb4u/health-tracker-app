package com.healthaitracker.controller;

import com.healthaitracker.dto.DailyNutritionSummary;
import com.healthaitracker.dto.FoodEntryRequest;
import com.healthaitracker.dto.FoodEntryResponse;
import com.healthaitracker.service.AuthorizationService;
import com.healthaitracker.service.FoodEntryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.PastOrPresent;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/users/{userId}")
public class FoodEntryController {

    private final FoodEntryService foodEntryService;
    private final AuthorizationService authorizationService;

    public FoodEntryController(
            FoodEntryService foodEntryService,
            AuthorizationService authorizationService) {
        this.foodEntryService = foodEntryService;
        this.authorizationService = authorizationService;
    }

    @PostMapping("/food-entries")
    public ResponseEntity<FoodEntryResponse> createFoodEntry(
            @PathVariable Long userId,
            @Valid @RequestBody FoodEntryRequest request) {
        authorizationService.requireSelf(userId);
        FoodEntryResponse created = foodEntryService.createFoodEntry(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/food-entries")
    public ResponseEntity<List<FoodEntryResponse>> getFoodEntries(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entryDate) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(foodEntryService.getFoodEntries(userId, entryDate));
    }

    @GetMapping("/food-entries/{foodEntryId}")
    public ResponseEntity<FoodEntryResponse> getFoodEntry(
            @PathVariable Long userId,
            @PathVariable Long foodEntryId) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(foodEntryService.getFoodEntry(userId, foodEntryId));
    }

    @PutMapping("/food-entries/{foodEntryId}")
    public ResponseEntity<FoodEntryResponse> updateFoodEntry(
            @PathVariable Long userId,
            @PathVariable Long foodEntryId,
            @Valid @RequestBody FoodEntryRequest request) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(foodEntryService.updateFoodEntry(userId, foodEntryId, request));
    }

    @DeleteMapping("/food-entries/{foodEntryId}")
    public ResponseEntity<Void> deleteFoodEntry(
            @PathVariable Long userId,
            @PathVariable Long foodEntryId) {
        authorizationService.requireSelf(userId);
        foodEntryService.deleteFoodEntry(userId, foodEntryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/nutrition-summary")
    public ResponseEntity<DailyNutritionSummary> getDailyNutritionSummary(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entryDate) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(foodEntryService.getDailyNutritionSummary(userId, entryDate));
    }
}
