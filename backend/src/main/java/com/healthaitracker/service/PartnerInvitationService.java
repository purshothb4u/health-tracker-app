package com.healthaitracker.service;

import com.healthaitracker.dto.PartnerInvitationCreatedResponse;
import com.healthaitracker.dto.PartnerInvitationPreviewResponse;
import com.healthaitracker.dto.PartnerInvitationStatusResponse;
import com.healthaitracker.dto.PartnerLinkResponse;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.PartnerInvitation;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.exception.PartnerInvitationUnavailableException;
import com.healthaitracker.exception.PartnerLinkingConflictException;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.PartnerInvitationRepository;
import com.healthaitracker.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class PartnerInvitationService {

    private static final long SINGLE_MEMBER_COUNT = 1L;
    private static final long LINKED_MEMBER_COUNT = 2L;
    private static final int CODE_GENERATION_ATTEMPTS = 5;

    private final PartnerInvitationRepository invitationRepository;
    private final HouseholdRepository householdRepository;
    private final UserAccountRepository userAccountRepository;
    private final AuthorizationService authorizationService;
    private final PartnerInvitationCodeService codeService;
    private final Duration invitationExpiration;

    public PartnerInvitationService(
            PartnerInvitationRepository invitationRepository,
            HouseholdRepository householdRepository,
            UserAccountRepository userAccountRepository,
            AuthorizationService authorizationService,
            PartnerInvitationCodeService codeService,
            @Value("${app.partner-invitations.expiration:7d}") Duration invitationExpiration) {
        if (invitationExpiration.isZero() || invitationExpiration.isNegative()) {
            throw new IllegalArgumentException("Partner invitation expiration must be positive");
        }
        this.invitationRepository = invitationRepository;
        this.householdRepository = householdRepository;
        this.userAccountRepository = userAccountRepository;
        this.authorizationService = authorizationService;
        this.codeService = codeService;
        this.invitationExpiration = invitationExpiration;
    }

    @Transactional
    public PartnerInvitationCreatedResponse createInvitation() {
        Long currentAccountId = authorizationService.currentAccountId();
        UserAccount accountSnapshot = findAccount(currentAccountId);
        Long householdId = accountSnapshot.getHousehold().getId();

        lockHousehold(householdId);
        UserAccount inviter = lockAccount(currentAccountId);
        requireMembershipUnchanged(inviter, householdId);
        requireSingleMemberHousehold(householdId);

        LocalDateTime now = currentTime();
        revokeActiveInvitations(householdId, now);
        PartnerInvitationCodeService.GeneratedInviteCode generatedCode = generateUniqueCode();

        PartnerInvitation invitation = new PartnerInvitation();
        invitation.setHousehold(inviter.getHousehold());
        invitation.setInviterAccount(inviter);
        invitation.setInviteCodeHash(generatedCode.hash());
        invitation.setCreatedAt(now);
        invitation.setExpiresAt(now.plus(invitationExpiration));
        invitationRepository.saveAndFlush(invitation);

        return new PartnerInvitationCreatedResponse(
                generatedCode.rawCode(),
                invitation.getExpiresAt());
    }

    public PartnerInvitationStatusResponse getActiveInvitation() {
        Long currentAccountId = authorizationService.currentAccountId();
        UserAccount account = findAccount(currentAccountId);
        List<PartnerInvitation> activeInvitations = invitationRepository.findActiveByHouseholdId(
                account.getHousehold().getId(),
                currentTime());
        if (activeInvitations.isEmpty()) {
            return PartnerInvitationStatusResponse.inactive();
        }
        return new PartnerInvitationStatusResponse(true, activeInvitations.getFirst().getExpiresAt());
    }

    @Transactional
    public void revokeActiveInvitation() {
        Long currentAccountId = authorizationService.currentAccountId();
        UserAccount accountSnapshot = findAccount(currentAccountId);
        Long householdId = accountSnapshot.getHousehold().getId();

        lockHousehold(householdId);
        UserAccount account = lockAccount(currentAccountId);
        requireMembershipUnchanged(account, householdId);
        revokeActiveInvitations(householdId, currentTime());
    }

    public PartnerInvitationPreviewResponse previewInvitation(String submittedCode) {
        authorizationService.currentAccountId();
        PartnerInvitation invitation = findInvitation(submittedCode);
        requireActive(invitation, currentTime());
        return new PartnerInvitationPreviewResponse(
                invitation.getInviterAccount().getUserProfile().getDisplayName(),
                invitation.getExpiresAt());
    }

    @Transactional
    public PartnerLinkResponse acceptInvitation(String submittedCode) {
        Long receiverAccountId = authorizationService.currentAccountId();
        PartnerInvitation invitationSnapshot = findInvitation(submittedCode);
        requireActive(invitationSnapshot, currentTime());
        UserAccount receiverSnapshot = findAccount(receiverAccountId);

        Long inviterAccountId = invitationSnapshot.getInviterAccount().getId();
        if (Objects.equals(inviterAccountId, receiverAccountId)) {
            throw new PartnerInvitationUnavailableException();
        }

        Long destinationHouseholdId = invitationSnapshot.getHousehold().getId();
        Long previousHouseholdId = receiverSnapshot.getHousehold().getId();
        if (Objects.equals(destinationHouseholdId, previousHouseholdId)) {
            throw new PartnerLinkingConflictException();
        }

        Map<Long, Household> lockedHouseholds = lockHouseholds(
                destinationHouseholdId,
                previousHouseholdId);
        Map<Long, UserAccount> lockedAccounts = lockAccounts(
                inviterAccountId,
                receiverAccountId);
        PartnerInvitation invitation = invitationRepository
                .findByIdForUpdate(invitationSnapshot.getId())
                .orElseThrow(PartnerInvitationUnavailableException::new);
        LocalDateTime now = currentTime();

        requireActive(invitation, now);
        UserAccount inviter = lockedAccounts.get(inviterAccountId);
        UserAccount receiver = lockedAccounts.get(receiverAccountId);
        requireMembershipUnchanged(inviter, destinationHouseholdId);
        requireMembershipUnchanged(receiver, previousHouseholdId);
        if (!Objects.equals(invitation.getHousehold().getId(), destinationHouseholdId)
                || !Objects.equals(invitation.getInviterAccount().getId(), inviterAccountId)) {
            throw new PartnerInvitationUnavailableException();
        }
        requireSingleMemberHousehold(destinationHouseholdId);
        requireSingleMemberHousehold(previousHouseholdId);

        invitation.setAcceptedAt(now);
        revokeActiveInvitations(previousHouseholdId, now);
        receiver.setHousehold(lockedHouseholds.get(destinationHouseholdId));
        invitationRepository.save(invitation);
        userAccountRepository.saveAndFlush(receiver);

        if (userAccountRepository.countByHouseholdId(destinationHouseholdId) != LINKED_MEMBER_COUNT
                || userAccountRepository.countByHouseholdId(previousHouseholdId) != 0L) {
            throw new PartnerLinkingConflictException();
        }

        invitationRepository.deleteAllByHouseholdId(previousHouseholdId);
        householdRepository.delete(lockedHouseholds.get(previousHouseholdId));
        householdRepository.flush();

        return new PartnerLinkResponse(
                inviter.getUserProfile().getId(),
                inviter.getUserProfile().getDisplayName());
    }

    private PartnerInvitation findInvitation(String submittedCode) {
        String hash = codeService.hashSubmittedCode(submittedCode)
                .orElseThrow(PartnerInvitationUnavailableException::new);
        return invitationRepository.findWithInviterByInviteCodeHash(hash)
                .orElseThrow(PartnerInvitationUnavailableException::new);
    }

    private UserAccount findAccount(Long accountId) {
        return userAccountRepository.findWithHouseholdAndProfileById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated account not found"));
    }

    private UserAccount lockAccount(Long accountId) {
        return userAccountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated account not found"));
    }

    private Map<Long, UserAccount> lockAccounts(Long firstAccountId, Long secondAccountId) {
        Map<Long, UserAccount> accounts = new HashMap<>();
        List.of(firstAccountId, secondAccountId).stream()
                .distinct()
                .sorted()
                .forEach(accountId -> accounts.put(accountId, lockAccount(accountId)));
        return accounts;
    }

    private Household lockHousehold(Long householdId) {
        return householdRepository.findByIdForUpdate(householdId)
                .orElseThrow(PartnerLinkingConflictException::new);
    }

    private Map<Long, Household> lockHouseholds(Long firstHouseholdId, Long secondHouseholdId) {
        Map<Long, Household> households = new HashMap<>();
        List.of(firstHouseholdId, secondHouseholdId).stream()
                .distinct()
                .sorted()
                .forEach(householdId -> households.put(householdId, lockHousehold(householdId)));
        return households;
    }

    private void requireSingleMemberHousehold(Long householdId) {
        if (userAccountRepository.countByHouseholdId(householdId) != SINGLE_MEMBER_COUNT) {
            throw new PartnerLinkingConflictException();
        }
    }

    private void requireMembershipUnchanged(UserAccount account, Long expectedHouseholdId) {
        if (!Objects.equals(account.getHousehold().getId(), expectedHouseholdId)) {
            throw new PartnerLinkingConflictException();
        }
    }

    private void requireActive(PartnerInvitation invitation, LocalDateTime now) {
        if (invitation.getAcceptedAt() != null
                || invitation.getRevokedAt() != null
                || !invitation.getExpiresAt().isAfter(now)) {
            throw new PartnerInvitationUnavailableException();
        }
    }

    private void revokeActiveInvitations(Long householdId, LocalDateTime now) {
        invitationRepository.findActiveByHouseholdId(householdId, now)
                .forEach(invitation -> invitation.setRevokedAt(now));
    }

    private PartnerInvitationCodeService.GeneratedInviteCode generateUniqueCode() {
        for (int attempt = 0; attempt < CODE_GENERATION_ATTEMPTS; attempt++) {
            PartnerInvitationCodeService.GeneratedInviteCode candidate = codeService.generate();
            if (!invitationRepository.existsByInviteCodeHash(candidate.hash())) {
                return candidate;
            }
        }
        throw new PartnerLinkingConflictException();
    }

    private LocalDateTime currentTime() {
        return LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
    }
}
