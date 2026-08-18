package com.healthaitracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PartnerInvitationCodeRequest(
        @NotBlank(message = "Invite code is required")
        @Size(max = 64, message = "Invite code must not exceed 64 characters")
        String inviteCode
) {
}
