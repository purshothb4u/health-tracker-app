export type GoalType =
  | 'ACTIVITY_MINUTES'
  | 'WATER_GOAL_DAYS'
  | 'SLEEP_TARGET_DAYS'
  | 'HEALTH_LOGGING_STREAK'
  | 'CUSTOM_CHECK_IN'

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  ACTIVITY_MINUTES: 'Activity minutes',
  WATER_GOAL_DAYS: 'Water goal days',
  SLEEP_TARGET_DAYS: 'Sleep target days',
  HEALTH_LOGGING_STREAK: 'Health logging streak',
  CUSTOM_CHECK_IN: 'Custom check-in',
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export interface GoalRequest {
  title: string
  goalType: GoalType
  startDate: string
  endDate: string
  targetValue: number
  qualifyingSleepMinutes?: number | null
  customUnit?: string | null
  notes?: string | null
}

export interface GoalStatusRequest {
  status: GoalStatus
}

export interface Goal {
  id: number
  userProfileId: number
  title: string
  goalType: GoalType
  startDate: string
  endDate: string
  targetValue: number
  qualifyingSleepMinutes: number | null
  customUnit: string | null
  displayUnit: string
  status: GoalStatus
  notes: string | null
  completedAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GoalProgress {
  goalId: number
  userProfileId: number
  goalType: GoalType
  currentValue: number | null
  targetValue: number
  displayUnit: string
  progressPercentage: number | null
  points: number
  goalReached: boolean | null
  progressAvailable: boolean
  message: string | null
}

export interface ProgressCheckInRequest {
  completed: boolean
  notes?: string | null
}

export interface GoalCheckIn {
  id: number
  goalId: number
  userProfileId: number
  checkInDate: string
  completed: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type AchievementType =
  | 'FIRST_GOAL_COMPLETED'
  | 'FIRST_COUPLE_CHALLENGE_COMPLETED'
  | 'BOTH_REACHED_CHALLENGE_TARGET'
  | 'SEVEN_DAY_CONSISTENCY'

export interface Achievement {
  achievementType: AchievementType
  title: string
  supportiveDescription: string
  userProfileId: number
  goalId: number | null
  challengeId: number | null
}
