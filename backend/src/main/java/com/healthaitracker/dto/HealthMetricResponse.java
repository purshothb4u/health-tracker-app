package com.healthaitracker.dto;

import com.healthaitracker.entity.HealthMetric;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record HealthMetricResponse(
        Long id,
        Long userProfileId,
        LocalDate metricDate,
        BigDecimal weightKg,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static HealthMetricResponse fromEntity(HealthMetric metric) {
        return new HealthMetricResponse(
                metric.getId(),
                metric.getUserProfile().getId(),
                metric.getMetricDate(),
                metric.getWeightKg(),
                metric.getNotes(),
                metric.getCreatedAt(),
                metric.getUpdatedAt()
        );
    }
}
