package com.healthaitracker.controller;

import com.healthaitracker.dto.PartnerInvitationCodeRequest;
import com.healthaitracker.dto.PartnerInvitationCreatedResponse;
import com.healthaitracker.dto.PartnerInvitationPreviewResponse;
import com.healthaitracker.dto.PartnerInvitationStatusResponse;
import com.healthaitracker.dto.PartnerLinkResponse;
import com.healthaitracker.service.PartnerInvitationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner-invitations")
public class PartnerInvitationController {

    private final PartnerInvitationService invitationService;

    public PartnerInvitationController(PartnerInvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping
    public ResponseEntity<PartnerInvitationCreatedResponse> createInvitation() {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invitationService.createInvitation());
    }

    @GetMapping("/active")
    public ResponseEntity<PartnerInvitationStatusResponse> getActiveInvitation() {
        return ResponseEntity.ok(invitationService.getActiveInvitation());
    }

    @DeleteMapping("/active")
    public ResponseEntity<Void> revokeActiveInvitation() {
        invitationService.revokeActiveInvitation();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/preview")
    public ResponseEntity<PartnerInvitationPreviewResponse> previewInvitation(
            @Valid @RequestBody PartnerInvitationCodeRequest request) {
        return ResponseEntity.ok(invitationService.previewInvitation(request.inviteCode()));
    }

    @PostMapping("/accept")
    public ResponseEntity<PartnerLinkResponse> acceptInvitation(
            @Valid @RequestBody PartnerInvitationCodeRequest request) {
        return ResponseEntity.ok(invitationService.acceptInvitation(request.inviteCode()));
    }
}
