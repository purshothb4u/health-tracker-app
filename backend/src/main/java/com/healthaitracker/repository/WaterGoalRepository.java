package com.healthaitracker.repository;

import com.healthaitracker.entity.WaterGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WaterGoalRepository extends JpaRepository<WaterGoal, Long> {

    Optional<WaterGoal> findByUserProfileId(Long userProfileId);

    boolean existsByUserProfileId(Long userProfileId);
}
