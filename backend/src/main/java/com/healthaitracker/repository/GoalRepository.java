package com.healthaitracker.repository;

import com.healthaitracker.entity.Goal;
import com.healthaitracker.entity.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    List<Goal> findByUserProfileIdOrderByCreatedAtAscIdAsc(Long userProfileId);

    List<Goal> findByUserProfileIdAndStatusOrderByCreatedAtAscIdAsc(
            Long userProfileId,
            GoalStatus status
    );

    Optional<Goal> findByIdAndUserProfileId(Long id, Long userProfileId);

    boolean existsByNotesStartingWith(String notesPrefix);
}
