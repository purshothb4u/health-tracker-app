package com.healthaitracker.dto;

import java.time.LocalDateTime;

public record PartnerInvitationStatusResponse(
        boolean active,
        LocalDateTime expiresAt
) {

    public static PartnerInvitationStatusResponse inactive() {
        return new PartnerInvitationStatusResponse(false, null);
    }
}
