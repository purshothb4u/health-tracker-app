package com.healthaitracker.dto;

import java.time.LocalDateTime;

public record PartnerInvitationPreviewResponse(
        String inviterDisplayName,
        LocalDateTime expiresAt
) {
}
