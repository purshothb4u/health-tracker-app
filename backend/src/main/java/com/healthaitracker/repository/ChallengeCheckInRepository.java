package com.healthaitracker.repository;

import com.healthaitracker.entity.ChallengeCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ChallengeCheckInRepository extends JpaRepository<ChallengeCheckIn, Long> {

    Optional<ChallengeCheckIn> findByParticipantIdAndCheckInDate(
            Long participantId,
            LocalDate checkInDate
    );

    List<ChallengeCheckIn> findByParticipantIdAndCheckInDateBetweenOrderByCheckInDateAscCreatedAtAscIdAsc(
            Long participantId,
            LocalDate fromDate,
            LocalDate toDate
    );

    List<ChallengeCheckIn> findByParticipantCoupleChallengeIdOrderByCheckInDateAscCreatedAtAscIdAsc(
            Long coupleChallengeId
    );

    void deleteByParticipantCoupleChallengeId(Long coupleChallengeId);
}
