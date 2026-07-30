package com.healthaitracker.controller;

import com.healthaitracker.dto.HydrationSummary;
import com.healthaitracker.dto.WaterEntryRequest;
import com.healthaitracker.dto.WaterEntryResponse;
import com.healthaitracker.dto.WaterGoalRequest;
import com.healthaitracker.dto.WaterGoalResponse;
import com.healthaitracker.service.WaterTrackingService;
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
public class WaterTrackingController {

    private final WaterTrackingService waterTrackingService;

    public WaterTrackingController(WaterTrackingService waterTrackingService) {
        this.waterTrackingService = waterTrackingService;
    }

    @PutMapping("/water-goal")
    public ResponseEntity<WaterGoalResponse> updateWaterGoal(
            @PathVariable Long userId,
            @Valid @RequestBody WaterGoalRequest request) {
        return ResponseEntity.ok(waterTrackingService.updateWaterGoal(userId, request));
    }

    @GetMapping("/water-goal")
    public ResponseEntity<WaterGoalResponse> getWaterGoal(@PathVariable Long userId) {
        return ResponseEntity.ok(waterTrackingService.getWaterGoal(userId));
    }

    @PostMapping("/water-entries")
    public ResponseEntity<WaterEntryResponse> createWaterEntry(
            @PathVariable Long userId,
            @Valid @RequestBody WaterEntryRequest request) {
        WaterEntryResponse created = waterTrackingService.createWaterEntry(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/water-entries")
    public ResponseEntity<List<WaterEntryResponse>> getWaterEntries(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entryDate) {
        return ResponseEntity.ok(waterTrackingService.getWaterEntries(userId, entryDate));
    }

    @GetMapping("/water-entries/{waterEntryId}")
    public ResponseEntity<WaterEntryResponse> getWaterEntry(
            @PathVariable Long userId,
            @PathVariable Long waterEntryId) {
        return ResponseEntity.ok(waterTrackingService.getWaterEntry(userId, waterEntryId));
    }

    @PutMapping("/water-entries/{waterEntryId}")
    public ResponseEntity<WaterEntryResponse> updateWaterEntry(
            @PathVariable Long userId,
            @PathVariable Long waterEntryId,
            @Valid @RequestBody WaterEntryRequest request) {
        return ResponseEntity.ok(waterTrackingService.updateWaterEntry(userId, waterEntryId, request));
    }

    @DeleteMapping("/water-entries/{waterEntryId}")
    public ResponseEntity<Void> deleteWaterEntry(
            @PathVariable Long userId,
            @PathVariable Long waterEntryId) {
        waterTrackingService.deleteWaterEntry(userId, waterEntryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/hydration-summary")
    public ResponseEntity<HydrationSummary> getHydrationSummary(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entryDate) {
        return ResponseEntity.ok(waterTrackingService.getHydrationSummary(userId, entryDate));
    }
}
