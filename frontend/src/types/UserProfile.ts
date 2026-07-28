export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface UserProfile {
  id: number
  name: string
  gender: Gender
  age: number
  heightCm: number
  startingWeightKg: number
  currentWeightKg: number
  targetWeightKg: number
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
