export interface WaterEntryRequest {
  entryDate: string
  amountMl: number
  notes?: string | null
}

export interface WaterEntry {
  id: number
  userProfileId: number
  entryDate: string
  amountMl: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface WaterGoalRequest {
  dailyGoalMl: number
}

export interface WaterGoal {
  userProfileId: number
  dailyGoalMl: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface HydrationSummary {
  entryDate: string
  totalConsumedMl: number
  entryCount: number
  currentDailyGoalMl: number | null
  remainingAgainstCurrentGoalMl: number | null
  excessAgainstCurrentGoalMl: number | null
  progressAgainstCurrentGoalPercentage: number | null
  goalReached: boolean | null
}
