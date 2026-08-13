package com.healthaitracker.controller;

import com.healthaitracker.dto.DailyTargetsResponse;
import com.healthaitracker.service.AuthorizationService;
import com.healthaitracker.service.DailyTargetCalculationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/daily-targets")
public class DailyTargetsController {

    private final DailyTargetCalculationService dailyTargetCalculationService;
    private final AuthorizationService authorizationService;

    public DailyTargetsController(
            DailyTargetCalculationService dailyTargetCalculationService,
            AuthorizationService authorizationService) {
        this.dailyTargetCalculationService = dailyTargetCalculationService;
        this.authorizationService = authorizationService;
    }

    @GetMapping
    public ResponseEntity<DailyTargetsResponse> getDailyTargets() {
        return ResponseEntity.ok(dailyTargetCalculationService.getDailyTargets(
                authorizationService.currentProfileId()));
    }
}
