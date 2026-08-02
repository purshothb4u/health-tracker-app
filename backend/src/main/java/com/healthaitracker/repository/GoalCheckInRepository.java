package com.healthaitracker.repository;

import com.healthaitracker.entity.GoalCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GoalCheckInRepository extends JpaRepository<GoalCheckIn, Long> {

    Optional<GoalCheckIn> findByGoalIdAndCheckInDate(Long goalId, LocalDate checkInDate);

    List<GoalCheckIn> findByGoalIdAndCheckInDateBetweenOrderByCheckInDateAscCreatedAtAscIdAsc(
            Long goalId,
            LocalDate fromDate,
            LocalDate toDate
    );

    List<GoalCheckIn> findByGoalIdOrderByCheckInDateAscCreatedAtAscIdAsc(Long goalId);

    void deleteByGoalId(Long goalId);
}
