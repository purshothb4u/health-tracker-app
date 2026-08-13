package com.healthaitracker.repository;

import com.healthaitracker.entity.CoupleChallengeParticipant;
import com.healthaitracker.entity.CoupleChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CoupleChallengeParticipantRepository
        extends JpaRepository<CoupleChallengeParticipant, Long> {

    Optional<CoupleChallengeParticipant> findByCoupleChallengeIdAndUserProfileId(
            Long coupleChallengeId,
            Long userProfileId
    );

    List<CoupleChallengeParticipant> findByCoupleChallengeIdOrderByCreatedAtAscIdAsc(
            Long coupleChallengeId
    );

    List<CoupleChallengeParticipant> findByUserProfileIdOrderByCreatedAtAscIdAsc(
            Long userProfileId
    );

    @Query("""
            SELECT participant.coupleChallenge
            FROM CoupleChallengeParticipant participant
            WHERE participant.userProfile.id = :userProfileId
            ORDER BY participant.coupleChallenge.createdAt, participant.coupleChallenge.id
            """)
    List<CoupleChallenge> findChallengesByUserProfileId(
            @Param("userProfileId") Long userProfileId
    );

    void deleteByCoupleChallengeId(Long coupleChallengeId);
}
