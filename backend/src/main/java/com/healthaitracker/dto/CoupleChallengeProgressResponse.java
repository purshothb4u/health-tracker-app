package com.healthaitracker.dto;

import com.healthaitracker.entity.ChallengeStatus;

import java.util.List;

public record CoupleChallengeProgressResponse(
        Long challengeId,
        ChallengeStatus status,
        List<ParticipantProgressResponse> participantProgress,
        Long leaderUserProfileId,
        boolean tie,
        boolean bothCompleted,
        String outcome,
        String supportiveMessage
) {
}
