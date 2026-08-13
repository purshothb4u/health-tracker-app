package com.healthaitracker.controller;

import com.healthaitracker.dto.DailySleepSummary;
import com.healthaitracker.dto.SleepEntryRequest;
import com.healthaitracker.dto.SleepEntryResponse;
import com.healthaitracker.service.AuthorizationService;
import com.healthaitracker.service.SleepTrackingService;
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
public class SleepTrackingController {

    private final SleepTrackingService sleepTrackingService;
    private final AuthorizationService authorizationService;

    public SleepTrackingController(
            SleepTrackingService sleepTrackingService,
            AuthorizationService authorizationService) {
        this.sleepTrackingService = sleepTrackingService;
        this.authorizationService = authorizationService;
    }

    @PostMapping("/sleep-entries")
    public ResponseEntity<SleepEntryResponse> createSleepEntry(
            @PathVariable Long userId,
            @Valid @RequestBody SleepEntryRequest request) {
        authorizationService.requireSelf(userId);
        SleepEntryResponse created = sleepTrackingService.createSleepEntry(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/sleep-entries")
    public ResponseEntity<List<SleepEntryResponse>> getSleepEntries(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate sleepDate) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(sleepTrackingService.getSleepEntries(userId, sleepDate));
    }

    @GetMapping("/sleep-entries/{sleepEntryId}")
    public ResponseEntity<SleepEntryResponse> getSleepEntry(
            @PathVariable Long userId,
            @PathVariable Long sleepEntryId) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(sleepTrackingService.getSleepEntry(userId, sleepEntryId));
    }

    @PutMapping("/sleep-entries/{sleepEntryId}")
    public ResponseEntity<SleepEntryResponse> updateSleepEntry(
            @PathVariable Long userId,
            @PathVariable Long sleepEntryId,
            @Valid @RequestBody SleepEntryRequest request) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(
                sleepTrackingService.updateSleepEntry(userId, sleepEntryId, request));
    }

    @DeleteMapping("/sleep-entries/{sleepEntryId}")
    public ResponseEntity<Void> deleteSleepEntry(
            @PathVariable Long userId,
            @PathVariable Long sleepEntryId) {
        authorizationService.requireSelf(userId);
        sleepTrackingService.deleteSleepEntry(userId, sleepEntryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sleep-summary")
    public ResponseEntity<DailySleepSummary> getDailySleepSummary(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate sleepDate) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(sleepTrackingService.getDailySleepSummary(userId, sleepDate));
    }
}
