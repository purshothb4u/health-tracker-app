package com.healthaitracker.repository;

import com.healthaitracker.entity.CoupleChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoupleChallengeRepository extends JpaRepository<CoupleChallenge, Long> {

    List<CoupleChallenge> findAllByOrderByCreatedAtAscIdAsc();

    boolean existsByNotesStartingWith(String notesPrefix);
}
