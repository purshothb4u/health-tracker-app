package com.healthaitracker.controller;

import com.healthaitracker.dto.ProfileOnboardingRequest;
import com.healthaitracker.dto.ProfileOnboardingResponse;
import com.healthaitracker.service.AuthorizationService;
import com.healthaitracker.service.ProfileOnboardingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile-onboarding")
public class ProfileOnboardingController {

    private final ProfileOnboardingService profileOnboardingService;
    private final AuthorizationService authorizationService;

    public ProfileOnboardingController(
            ProfileOnboardingService profileOnboardingService,
            AuthorizationService authorizationService) {
        this.profileOnboardingService = profileOnboardingService;
        this.authorizationService = authorizationService;
    }

    @GetMapping
    public ResponseEntity<ProfileOnboardingResponse> getCurrentProfile() {
        return ResponseEntity.ok(profileOnboardingService.getProfile(
                authorizationService.currentProfileId()));
    }

    @PutMapping
    public ResponseEntity<ProfileOnboardingResponse> saveCurrentProfile(
            @Valid @RequestBody ProfileOnboardingRequest request) {
        return ResponseEntity.ok(profileOnboardingService.saveProfile(
                authorizationService.currentProfileId(),
                request));
    }
}
