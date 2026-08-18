package com.healthaitracker.exception;

public class PartnerLinkingConflictException extends RuntimeException {

    public PartnerLinkingConflictException() {
        super("Partner linking is unavailable for this account");
    }
}
