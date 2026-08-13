package com.healthaitracker.dto;

public record CsrfTokenResponse(
        String headerName,
        String parameterName,
        String token
) {
}
