package com.healthaitracker.repository;

import com.healthaitracker.entity.PartnerInvitation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PartnerInvitationRepository extends JpaRepository<PartnerInvitation, Long> {

    boolean existsByInviteCodeHash(String inviteCodeHash);

    @Query("""
            select invitation
            from PartnerInvitation invitation
            join fetch invitation.household
            join fetch invitation.inviterAccount inviter
            join fetch inviter.userProfile
            where invitation.inviteCodeHash = :inviteCodeHash
            """)
    Optional<PartnerInvitation> findWithInviterByInviteCodeHash(
            @Param("inviteCodeHash") String inviteCodeHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select invitation
            from PartnerInvitation invitation
            join fetch invitation.household
            join fetch invitation.inviterAccount inviter
            join fetch inviter.userProfile
            where invitation.id = :invitationId
            """)
    Optional<PartnerInvitation> findByIdForUpdate(@Param("invitationId") Long invitationId);

    @Query("""
            select invitation
            from PartnerInvitation invitation
            where invitation.household.id = :householdId
              and invitation.acceptedAt is null
              and invitation.revokedAt is null
              and invitation.expiresAt > :now
            order by invitation.createdAt desc, invitation.id desc
            """)
    List<PartnerInvitation> findActiveByHouseholdId(
            @Param("householdId") Long householdId,
            @Param("now") LocalDateTime now);

    @Modifying
    void deleteAllByHouseholdId(Long householdId);
}
