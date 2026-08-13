package com.healthaitracker.controller;

import com.healthaitracker.dto.ActivityEntryRequest;
import com.healthaitracker.dto.ActivityEntryResponse;
import com.healthaitracker.dto.DailyActivitySummary;
import com.healthaitracker.service.AuthorizationService;
import com.healthaitracker.service.ActivityTrackingService;
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
public class ActivityTrackingController {

    private final ActivityTrackingService activityTrackingService;
    private final AuthorizationService authorizationService;

    public ActivityTrackingController(
            ActivityTrackingService activityTrackingService,
            AuthorizationService authorizationService) {
        this.activityTrackingService = activityTrackingService;
        this.authorizationService = authorizationService;
    }

    @PostMapping("/activity-entries")
    public ResponseEntity<ActivityEntryResponse> createActivityEntry(
            @PathVariable Long userId,
            @Valid @RequestBody ActivityEntryRequest request) {
        authorizationService.requireSelf(userId);
        ActivityEntryResponse created = activityTrackingService.createActivityEntry(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/activity-entries")
    public ResponseEntity<List<ActivityEntryResponse>> getActivityEntries(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate activityDate) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(activityTrackingService.getActivityEntries(userId, activityDate));
    }

    @GetMapping("/activity-entries/{activityEntryId}")
    public ResponseEntity<ActivityEntryResponse> getActivityEntry(
            @PathVariable Long userId,
            @PathVariable Long activityEntryId) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(activityTrackingService.getActivityEntry(userId, activityEntryId));
    }

    @PutMapping("/activity-entries/{activityEntryId}")
    public ResponseEntity<ActivityEntryResponse> updateActivityEntry(
            @PathVariable Long userId,
            @PathVariable Long activityEntryId,
            @Valid @RequestBody ActivityEntryRequest request) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(
                activityTrackingService.updateActivityEntry(userId, activityEntryId, request));
    }

    @DeleteMapping("/activity-entries/{activityEntryId}")
    public ResponseEntity<Void> deleteActivityEntry(
            @PathVariable Long userId,
            @PathVariable Long activityEntryId) {
        authorizationService.requireSelf(userId);
        activityTrackingService.deleteActivityEntry(userId, activityEntryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/activity-summary")
    public ResponseEntity<DailyActivitySummary> getDailyActivitySummary(
            @PathVariable Long userId,
            @RequestParam("date") @PastOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate activityDate) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(activityTrackingService.getDailyActivitySummary(userId, activityDate));
    }
}
