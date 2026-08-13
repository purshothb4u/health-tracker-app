import type { ActivityLevel, Gender, ProfileGoalType } from './UserProfile'

export interface ProfileOnboarding {
  profileId: number
  displayName: string | null
  sex: Gender | null
  dateOfBirth: string | null
  age: number | null
  heightCm: number | null
  currentWeightKg: number | null
  targetWeightKg: number | null
  activityLevel: ActivityLevel | null
  goalType: ProfileGoalType | null
  profileComplete: boolean
  hasWeightHistory: boolean
}

export interface ProfileOnboardingRequest {
  displayName: string
  sex: Gender
  dateOfBirth: string
  heightCm: number
  currentWeightKg: number
  targetWeightKg: number
  activityLevel: ActivityLevel
  goalType: ProfileGoalType
}
