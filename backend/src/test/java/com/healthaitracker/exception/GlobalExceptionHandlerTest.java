package com.healthaitracker.exception;

import com.healthaitracker.dto.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

    @Test
    void mapsTheWaterGoalSingletonConstraintToConflict() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "Could not persist water goal",
                new IllegalStateException("Constraint violation: UK_WATER_GOALS_USER_PROFILE")
        );

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDataIntegrityViolation(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message())
                .isEqualTo("A water goal already exists for this user profile");
    }
}
