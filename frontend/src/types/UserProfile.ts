export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type ActivityLevel = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE'
export type ProfileGoalType = 'LOSE_WEIGHT' | 'MAINTAIN_WEIGHT' | 'GAIN_WEIGHT'

export interface UserProfile {
  id: number
  name: string
  displayName: string
  gender: Gender
  dateOfBirth: string | null
  age: number
  heightCm: number
  startingWeightKg: number
  currentWeightKg: number
  targetWeightKg: number
  activityLevel: ActivityLevel | null
  goalType: ProfileGoalType | null
  weightLostKg: number
  weightRemainingKg: number
  goalProgressPercent: number
  createdAt: string
  updatedAt: string
}

export interface UserProfileRequest {
  name: string
  gender: Gender
  age: number
  heightCm: number
  startingWeightKg: number
  currentWeightKg: number
  targetWeightKg: number
}
