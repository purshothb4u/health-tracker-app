package com.healthaitracker.controller;

import com.healthaitracker.dto.AnalyticsResponse;
import com.healthaitracker.service.AnalyticsService;
import com.healthaitracker.service.AuthorizationService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/users/{userId}")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final AuthorizationService authorizationService;

    public AnalyticsController(
            AnalyticsService analyticsService,
            AuthorizationService authorizationService) {
        this.analyticsService = analyticsService;
        this.authorizationService = authorizationService;
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @PathVariable Long userId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        authorizationService.requireSelf(userId);
        return ResponseEntity.ok(analyticsService.getAnalytics(userId, fromDate, toDate));
    }
}
