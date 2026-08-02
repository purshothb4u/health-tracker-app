package com.healthaitracker.repository;

import com.healthaitracker.entity.SleepEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SleepEntryRepository extends JpaRepository<SleepEntry, Long> {

    List<SleepEntry> findByUserProfileIdAndSleepDateOrderByStartDateTimeAscCreatedAtAscIdAsc(
            Long userProfileId,
            LocalDate sleepDate
    );

    List<SleepEntry> findByUserProfileIdAndSleepDateBetweenOrderBySleepDateAscStartDateTimeAscCreatedAtAscIdAsc(
            Long userProfileId,
            LocalDate fromDate,
            LocalDate toDate
    );

    Optional<SleepEntry> findByIdAndUserProfileId(Long id, Long userProfileId);

    boolean existsByNotesStartingWith(String notesPrefix);
}
