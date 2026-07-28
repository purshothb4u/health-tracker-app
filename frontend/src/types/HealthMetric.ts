export interface HealthMetric {
  id: number
  userProfileId: number
  metricDate: string
  weightKg: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface HealthMetricRequest {
  metricDate: string
  weightKg: number
  notes?: string
}

export interface HealthSummary {
  userProfileId: number
  latestWeightKg: number
  latestMetricDate: string | null
  bmi: number
  bmrCaloriesPerDay: number | null
  maintenanceCaloriesPerDay: number | null
  weightLostKg: number
  weightRemainingKg: number
  goalProgressPercent: number
}
