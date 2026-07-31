export type ActivityCategory =
  | 'WALKING'
  | 'RUNNING'
  | 'CYCLING'
  | 'STRENGTH_TRAINING'
  | 'YOGA'
  | 'SPORTS'
  | 'OTHER'

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  WALKING: 'Walking',
  RUNNING: 'Running',
  CYCLING: 'Cycling',
  STRENGTH_TRAINING: 'Strength training',
  YOGA: 'Yoga',
  SPORTS: 'Sports',
  OTHER: 'Other',
}

export interface ActivityEntryRequest {
  activityDate: string
  category: ActivityCategory
  activityName: string
  durationMinutes: number
  steps?: number | null
  distanceKm?: number | null
  reportedCaloriesBurned?: number | null
  notes?: string | null
}

export interface ActivityEntry {
  id: number
  userProfileId: number
  activityDate: string
  category: ActivityCategory
  activityName: string
  durationMinutes: number
  steps: number | null
  distanceKm: number | null
  reportedCaloriesBurned: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DailyActivitySummary {
  userProfileId: number
  activityDate: string
  activityCount: number
  totalDurationMinutes: number
  reportedSteps: number | null
  reportedDistanceKm: number | null
  reportedCaloriesBurned: number | null
}
