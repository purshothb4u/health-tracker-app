package com.healthaitracker.dto;

import java.time.LocalDateTime;

public record PartnerInvitationCreatedResponse(
        String inviteCode,
        LocalDateTime expiresAt
) {
}
