import type { Achievement, ProgressCheckInRequest } from './Goal'

export type ChallengeType =
  | 'ACTIVITY_MINUTES'
  | 'WATER_GOAL_DAYS'
  | 'SLEEP_TARGET_DAYS'
  | 'HEALTH_LOGGING_STREAK'
  | 'CUSTOM_CHECK_IN'

export type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  ACTIVITY_MINUTES: 'Activity minutes',
  WATER_GOAL_DAYS: 'Water goal days',
  SLEEP_TARGET_DAYS: 'Sleep target days',
  HEALTH_LOGGING_STREAK: 'Health logging streak',
  CUSTOM_CHECK_IN: 'Custom check-in',
}

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export interface CoupleChallengeRequest {
  title: string
  challengeType: ChallengeType
  startDate: string
  endDate: string
  targetValue: number
  qualifyingSleepMinutes?: number | null
  customUnit?: string | null
  participantUserProfileIds: number[]
  notes?: string | null
}

export interface ChallengeStatusRequest {
  status: ChallengeStatus
}

export interface CoupleChallengeParticipant {
  userProfileId: number
  profileName: string
}

export interface CoupleChallenge {
  id: number
  title: string
  challengeType: ChallengeType
  startDate: string
  endDate: string
  targetValue: number
  qualifyingSleepMinutes: number | null
  customUnit: string | null
  displayUnit: string
  status: ChallengeStatus
  participants: CoupleChallengeParticipant[]
  notes: string | null
  completedAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ParticipantProgress {
  userProfileId: number
  profileName: string
  currentValue: number | null
  targetValue: number
  displayUnit: string
  progressPercentage: number | null
  points: number
  goalReached: boolean | null
  progressAvailable: boolean
  message: string | null
}

export interface CoupleChallengeProgress {
  challengeId: number
  status: ChallengeStatus
  participantProgress: ParticipantProgress[]
  leaderUserProfileId: number | null
  tie: boolean
  bothCompleted: boolean
  outcome: string
  supportiveMessage: string
}

export interface ChallengeCheckIn {
  id: number
  challengeId: number
  participantUserProfileId: number
  checkInDate: string
  completed: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type { Achievement, ProgressCheckInRequest }
