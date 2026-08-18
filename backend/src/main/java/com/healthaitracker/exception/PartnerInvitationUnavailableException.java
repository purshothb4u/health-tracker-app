package com.healthaitracker.exception;

public class PartnerInvitationUnavailableException extends RuntimeException {

    public PartnerInvitationUnavailableException() {
        super("Invitation is invalid or unavailable");
    }
}
