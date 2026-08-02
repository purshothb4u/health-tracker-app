package com.healthaitracker.repository;

import com.healthaitracker.entity.ActivityEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityEntryRepository extends JpaRepository<ActivityEntry, Long> {

    List<ActivityEntry> findByUserProfileIdAndActivityDateOrderByCreatedAtAscIdAsc(
            Long userProfileId,
            LocalDate activityDate
    );

    List<ActivityEntry> findByUserProfileIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAscIdAsc(
            Long userProfileId,
            LocalDate fromDate,
            LocalDate toDate
    );

    Optional<ActivityEntry> findByIdAndUserProfileId(Long id, Long userProfileId);

    boolean existsByNotesStartingWith(String notesPrefix);
}
