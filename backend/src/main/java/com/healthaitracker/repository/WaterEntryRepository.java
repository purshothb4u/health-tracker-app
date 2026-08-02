package com.healthaitracker.repository;

import com.healthaitracker.entity.WaterEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WaterEntryRepository extends JpaRepository<WaterEntry, Long> {

    List<WaterEntry> findByUserProfileIdAndEntryDateOrderByCreatedAtAscIdAsc(
            Long userProfileId,
            LocalDate entryDate
    );

    List<WaterEntry> findByUserProfileIdAndEntryDateBetweenOrderByEntryDateAscCreatedAtAscIdAsc(
            Long userProfileId,
            LocalDate fromDate,
            LocalDate toDate
    );

    Optional<WaterEntry> findByIdAndUserProfileId(Long id, Long userProfileId);

    boolean existsByNotesStartingWith(String notesPrefix);
}
