export type SleepType = 'NIGHT_SLEEP' | 'NAP' | 'OTHER'

export const SLEEP_TYPE_LABELS: Record<SleepType, string> = {
  NIGHT_SLEEP: 'Night sleep',
  NAP: 'Nap',
  OTHER: 'Other',
}

export interface SleepEntryRequest {
  sleepDate: string
  sleepType: SleepType
  startDateTime: string
  endDateTime: string
  qualityRating?: number | null
  notes?: string | null
}

export interface SleepEntry {
  id: number
  userProfileId: number
  sleepDate: string
  sleepType: SleepType
  startDateTime: string
  endDateTime: string
  durationMinutes: number
  qualityRating: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DailySleepSummary {
  userProfileId: number
  sleepDate: string
  sessionCount: number
  totalSleepMinutes: number
  averageQuality: number | null
  nightSleepMinutes: number
  napMinutes: number
}
