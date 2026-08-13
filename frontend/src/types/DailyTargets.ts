import type { ActivityLevel, ProfileGoalType } from './UserProfile'

export interface DailyTargets {
  age: number
  currentWeightKg: number
  activityLevel: ActivityLevel
  usedLegacyActivityFallback: boolean
  goalType: ProfileGoalType | null
  adultEligible: boolean
  bmrKcal: number | null
  estimatedMaintenanceKcal: number | null
  estimatedCalorieTargetKcal: number | null
  proteinTargetG: number | null
  carbohydrateTargetG: number | null
  fatTargetG: number | null
  estimatedHydrationMl: number | null
  calorieTargetsAvailable: boolean
  calorieTargetsUnavailableReason: string | null
  hydrationEstimateAvailable: boolean
  hydrationEstimateUnavailableReason: string | null
}
