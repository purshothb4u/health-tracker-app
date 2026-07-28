package com.healthaitracker.repository;

import com.healthaitracker.entity.HealthMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HealthMetricRepository extends JpaRepository<HealthMetric, Long> {

    boolean existsByUserProfileIdAndMetricDate(Long userProfileId, LocalDate metricDate);

    Optional<HealthMetric> findByUserProfileIdAndMetricDate(Long userProfileId, LocalDate metricDate);

    List<HealthMetric> findByUserProfileIdOrderByMetricDateDesc(Long userProfileId);

    Optional<HealthMetric> findFirstByUserProfileIdOrderByMetricDateDesc(Long userProfileId);
}
