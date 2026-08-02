package com.healthaitracker.controller;

import com.healthaitracker.dto.AchievementResponse;
import com.healthaitracker.dto.GoalCheckInResponse;
import com.healthaitracker.dto.GoalProgressResponse;
import com.healthaitracker.dto.GoalRequest;
import com.healthaitracker.dto.GoalResponse;
import com.healthaitracker.dto.GoalStatusRequest;
import com.healthaitracker.dto.ProgressCheckInRequest;
import com.healthaitracker.entity.GoalStatus;
import com.healthaitracker.service.AchievementService;
import com.healthaitracker.service.GoalService;
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
@RequestMapping("/api/users/{userId}")
public class GoalController {

    private final GoalService goalService;
    private final AchievementService achievementService;

    public GoalController(GoalService goalService, AchievementService achievementService) {
        this.goalService = goalService;
        this.achievementService = achievementService;
    }

    @PostMapping("/goals")
    public ResponseEntity<GoalResponse> createGoal(
            @PathVariable Long userId,
            @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.createGoal(userId, request));
    }

    @GetMapping("/goals")
    public ResponseEntity<List<GoalResponse>> getGoals(
            @PathVariable Long userId,
            @RequestParam(required = false) GoalStatus status) {
        return ResponseEntity.ok(goalService.getGoals(userId, status));
    }

    @GetMapping("/goals/{goalId}")
    public ResponseEntity<GoalResponse> getGoal(
            @PathVariable Long userId,
            @PathVariable Long goalId) {
        return ResponseEntity.ok(goalService.getGoal(userId, goalId));
    }

    @PutMapping("/goals/{goalId}")
    public ResponseEntity<GoalResponse> updateGoal(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(userId, goalId, request));
    }

    @PutMapping("/goals/{goalId}/status")
    public ResponseEntity<GoalResponse> updateGoalStatus(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @Valid @RequestBody GoalStatusRequest request) {
        return ResponseEntity.ok(goalService.updateGoalStatus(userId, goalId, request));
    }

    @DeleteMapping("/goals/{goalId}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long userId,
            @PathVariable Long goalId) {
        goalService.deleteGoal(userId, goalId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/goals/{goalId}/progress")
    public ResponseEntity<GoalProgressResponse> getGoalProgress(
            @PathVariable Long userId,
            @PathVariable Long goalId) {
        return ResponseEntity.ok(goalService.getGoalProgress(userId, goalId, LocalDate.now()));
    }

    @PutMapping("/goals/{goalId}/check-ins/{date}")
    public ResponseEntity<GoalCheckInResponse> upsertGoalCheckIn(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody ProgressCheckInRequest request) {
        return ResponseEntity.ok(goalService.upsertGoalCheckIn(userId, goalId, date, request));
    }

    @GetMapping("/goal-achievements")
    public ResponseEntity<List<AchievementResponse>> getGoalAchievements(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                achievementService.getGoalAchievements(userId, LocalDate.now()));
    }
}
