package com.healthaitracker.controller;

import com.healthaitracker.dto.UserProfileRequest;
import com.healthaitracker.dto.UserProfileResponse;
import com.healthaitracker.service.AuthorizationService;
import com.healthaitracker.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final AuthorizationService authorizationService;

    public UserProfileController(
            UserProfileService userProfileService,
            AuthorizationService authorizationService) {
        this.userProfileService = userProfileService;
        this.authorizationService = authorizationService;
    }

    @GetMapping
    public ResponseEntity<List<UserProfileResponse>> getAllProfiles() {
        return ResponseEntity.ok(List.of(userProfileService.getProfileById(
                authorizationService.currentProfileId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getProfileById(@PathVariable Long id) {
        authorizationService.requireSelf(id);
        return ResponseEntity.ok(userProfileService.getProfileById(id));
    }

    @PostMapping
    public ResponseEntity<UserProfileResponse> createProfile(@Valid @RequestBody UserProfileRequest request) {
        UserProfileResponse created = userProfileService.createProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody UserProfileRequest request) {
        authorizationService.requireSelf(id);
        return ResponseEntity.ok(userProfileService.updateProfile(id, request));
    }
}
