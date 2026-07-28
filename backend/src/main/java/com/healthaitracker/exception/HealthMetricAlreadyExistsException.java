package com.healthaitracker.exception;

public class HealthMetricAlreadyExistsException extends RuntimeException {

    public HealthMetricAlreadyExistsException(String message) {
        super(message);
    }
}
