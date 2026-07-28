package com.healthaitracker.controller;

import com.healthaitracker.dto.HealthMetricRequest;
import com.healthaitracker.dto.HealthMetricResponse;
import com.healthaitracker.dto.HealthSummary;
import com.healthaitracker.service.HealthMetricService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/{id}")
public class HealthMetricController {

    private final HealthMetricService healthMetricService;

    public HealthMetricController(HealthMetricService healthMetricService) {
        this.healthMetricService = healthMetricService;
    }

    @PostMapping("/metrics")
    public ResponseEntity<HealthMetricResponse> createMetric(
            @PathVariable Long id,
            @Valid @RequestBody HealthMetricRequest request) {
        HealthMetricResponse created = healthMetricService.createMetric(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/metrics")
    public ResponseEntity<List<HealthMetricResponse>> getMetrics(@PathVariable Long id) {
        return ResponseEntity.ok(healthMetricService.getMetrics(id));
    }

    @GetMapping("/metrics/latest")
    public ResponseEntity<HealthMetricResponse> getLatestMetric(@PathVariable Long id) {
        return ResponseEntity.ok(healthMetricService.getLatestMetric(id));
    }

    @GetMapping("/summary")
    public ResponseEntity<HealthSummary> getHealthSummary(@PathVariable Long id) {
        return ResponseEntity.ok(healthMetricService.getHealthSummary(id));
    }

    @PutMapping("/metrics/{metricId}")
    public ResponseEntity<HealthMetricResponse> updateMetric(
            @PathVariable Long id,
            @PathVariable Long metricId,
            @Valid @RequestBody HealthMetricRequest request) {
        return ResponseEntity.ok(healthMetricService.updateMetric(id, metricId, request));
    }
}
