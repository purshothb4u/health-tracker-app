import { del, get, post, put } from './client'
import type {
  Achievement,
  Goal,
  GoalCheckIn,
  GoalProgress,
  GoalRequest,
  GoalStatus,
  GoalStatusRequest,
  ProgressCheckInRequest,
} from '../types/Goal'

function goalsPath(userProfileId: number): string {
  return `/api/users/${userProfileId}/goals`
}

export function createGoal(userProfileId: number, data: GoalRequest): Promise<Goal> {
  return post<Goal>(goalsPath(userProfileId), data)
}

export function fetchGoals(userProfileId: number, status?: GoalStatus | null): Promise<Goal[]> {
  const query = status === undefined || status === null
    ? ''
    : `?status=${encodeURIComponent(status)}`
  return get<Goal[]>(`${goalsPath(userProfileId)}${query}`)
}

export function fetchGoal(userProfileId: number, goalId: number): Promise<Goal> {
  return get<Goal>(`${goalsPath(userProfileId)}/${goalId}`)
}

export function updateGoal(
  userProfileId: number,
  goalId: number,
  data: GoalRequest,
): Promise<Goal> {
  return put<Goal>(`${goalsPath(userProfileId)}/${goalId}`, data)
}

export function updateGoalStatus(
  userProfileId: number,
  goalId: number,
  data: GoalStatusRequest,
): Promise<Goal> {
  return put<Goal>(`${goalsPath(userProfileId)}/${goalId}/status`, data)
}

export function deleteGoal(userProfileId: number, goalId: number): Promise<void> {
  return del<void>(`${goalsPath(userProfileId)}/${goalId}`)
}

export function fetchGoalProgress(userProfileId: number, goalId: number): Promise<GoalProgress> {
  return get<GoalProgress>(`${goalsPath(userProfileId)}/${goalId}/progress`)
}

export function upsertGoalCheckIn(
  userProfileId: number,
  goalId: number,
  date: string,
  data: ProgressCheckInRequest,
): Promise<GoalCheckIn> {
  return put<GoalCheckIn>(
    `${goalsPath(userProfileId)}/${goalId}/check-ins/${encodeURIComponent(date)}`,
    data,
  )
}

export function fetchGoalAchievements(userProfileId: number): Promise<Achievement[]> {
  return get<Achievement[]>(`/api/users/${userProfileId}/goal-achievements`)
}
