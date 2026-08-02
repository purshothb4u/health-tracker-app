package com.healthaitracker.repository;

import com.healthaitracker.entity.CoupleChallengeParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

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

    void deleteByCoupleChallengeId(Long coupleChallengeId);
}
