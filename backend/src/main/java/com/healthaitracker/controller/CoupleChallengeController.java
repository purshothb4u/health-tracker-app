package com.healthaitracker.controller;

import com.healthaitracker.dto.AchievementResponse;
import com.healthaitracker.dto.ChallengeCheckInResponse;
import com.healthaitracker.dto.ChallengeStatusRequest;
import com.healthaitracker.dto.CoupleChallengeProgressResponse;
import com.healthaitracker.dto.CoupleChallengeRequest;
import com.healthaitracker.dto.CoupleChallengeResponse;
import com.healthaitracker.dto.EligibleCoupleParticipantResponse;
import com.healthaitracker.dto.ProgressCheckInRequest;
import com.healthaitracker.entity.ChallengeStatus;
import com.healthaitracker.service.AchievementService;
import com.healthaitracker.service.AuthorizationService;
import com.healthaitracker.service.CoupleChallengeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CoupleChallengeController {

    private final CoupleChallengeService challengeService;
    private final AchievementService achievementService;
    private final AuthorizationService authorizationService;

    public CoupleChallengeController(
            CoupleChallengeService challengeService,
            AchievementService achievementService,
            AuthorizationService authorizationService) {
        this.challengeService = challengeService;
        this.achievementService = achievementService;
        this.authorizationService = authorizationService;
    }

    @PostMapping("/couple-challenges")
    public ResponseEntity<CoupleChallengeResponse> createChallenge(
            @Valid @RequestBody CoupleChallengeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(challengeService.createChallenge(request, LocalDate.now()));
    }

    @GetMapping("/couple-challenges")
    public ResponseEntity<List<CoupleChallengeResponse>> getChallenges(
            @RequestParam(required = false) ChallengeStatus status) {
        return ResponseEntity.ok(challengeService.getChallenges(status, LocalDate.now()));
    }

    @GetMapping("/couple-challenges/eligible-participants")
    public ResponseEntity<List<EligibleCoupleParticipantResponse>> getEligibleParticipants() {
        return ResponseEntity.ok(authorizationService.getEligibleCoupleParticipants());
    }

    @GetMapping("/couple-challenges/{challengeId}")
    public ResponseEntity<CoupleChallengeResponse> getChallenge(@PathVariable Long challengeId) {
        return ResponseEntity.ok(challengeService.getChallenge(challengeId, LocalDate.now()));
    }

    @PutMapping("/couple-challenges/{challengeId}")
    public ResponseEntity<CoupleChallengeResponse> updateChallenge(
            @PathVariable Long challengeId,
            @Valid @RequestBody CoupleChallengeRequest request) {
        return ResponseEntity.ok(
                challengeService.updateChallenge(challengeId, request, LocalDate.now()));
    }

    @PutMapping("/couple-challenges/{challengeId}/status")
    public ResponseEntity<CoupleChallengeResponse> updateChallengeStatus(
            @PathVariable Long challengeId,
            @Valid @RequestBody ChallengeStatusRequest request) {
        return ResponseEntity.ok(
                challengeService.updateChallengeStatus(challengeId, request, LocalDate.now()));
    }

    @DeleteMapping("/couple-challenges/{challengeId}")
    public ResponseEntity<Void> deleteChallenge(@PathVariable Long challengeId) {
        challengeService.deleteChallenge(challengeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/couple-challenges/{challengeId}/progress")
    public ResponseEntity<CoupleChallengeProgressResponse> getChallengeProgress(
            @PathVariable Long challengeId) {
        return ResponseEntity.ok(
                challengeService.getChallengeProgress(challengeId, LocalDate.now()));
    }

    @PutMapping("/couple-challenges/{challengeId}/participants/{userId}/check-ins/{date}")
    public ResponseEntity<ChallengeCheckInResponse> upsertChallengeCheckIn(
            @PathVariable Long challengeId,
            @PathVariable Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody ProgressCheckInRequest request) {
        return ResponseEntity.ok(challengeService.upsertChallengeCheckIn(
                challengeId,
                userId,
                date,
                request,
                LocalDate.now()));
    }

    @GetMapping("/users/{userId}/couple-achievements")
    public ResponseEntity<List<AchievementResponse>> getCoupleAchievements(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                achievementService.getCoupleChallengeAchievements(userId, LocalDate.now()));
    }
}
