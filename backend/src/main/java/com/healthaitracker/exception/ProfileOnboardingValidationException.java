package com.healthaitracker.exception;

public class ProfileOnboardingValidationException extends IllegalArgumentException {

    private final String field;

    public ProfileOnboardingValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
