package com.healthaitracker.service;

import com.healthaitracker.dto.UserProfileRequest;
import com.healthaitracker.dto.UserProfileResponse;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    public UserProfileService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    public List<UserProfileResponse> getAllProfiles() {
        return userProfileRepository.findAll().stream()
                .map(UserProfileResponse::fromEntity)
                .toList();
    }

    public UserProfileResponse getProfileById(Long id) {
        UserProfile profile = findProfileOrThrow(id);
        return UserProfileResponse.fromEntity(profile);
    }

    @Transactional
    public UserProfileResponse createProfile(UserProfileRequest request) {
        UserProfile profile = mapToEntity(new UserProfile(), request);
        UserProfile saved = userProfileRepository.save(profile);
        return UserProfileResponse.fromEntity(saved);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long id, UserProfileRequest request) {
        UserProfile profile = findProfileOrThrow(id);
        validateImmutableWeights(profile, request);
        mapMutableFields(profile, request);
        UserProfile updated = userProfileRepository.save(profile);
        return UserProfileResponse.fromEntity(updated);
    }

    private UserProfile findProfileOrThrow(Long id) {
        return userProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found with id: " + id));
    }

    private UserProfile mapToEntity(UserProfile profile, UserProfileRequest request) {
        profile.setName(request.name());
        profile.setGender(request.gender());
        profile.setAge(request.age());
        profile.setHeightCm(request.heightCm());
        profile.setStartingWeightKg(request.startingWeightKg());
        profile.setCurrentWeightKg(request.currentWeightKg());
        profile.setTargetWeightKg(request.targetWeightKg());
        return profile;
    }

    private void mapMutableFields(UserProfile profile, UserProfileRequest request) {
        profile.setName(request.name());
        profile.setGender(request.gender());
        profile.setAge(request.age());
        profile.setHeightCm(request.heightCm());
        profile.setTargetWeightKg(request.targetWeightKg());
    }

    private void validateImmutableWeights(UserProfile profile, UserProfileRequest request) {
        if (!Objects.equals(profile.getStartingWeightKg(), request.startingWeightKg())) {
            throw new IllegalArgumentException("Starting weight cannot be changed after profile creation");
        }
        if (!Objects.equals(profile.getCurrentWeightKg(), request.currentWeightKg())) {
            throw new IllegalArgumentException("Current weight must be updated by recording a health metric");
        }
    }
}
