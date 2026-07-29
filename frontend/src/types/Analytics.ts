export interface AnalyticsResponse {
  userProfileId: number
  fromDate: string
  toDate: string
  weightAnalytics: WeightAnalytics
  nutritionAnalytics: NutritionAnalytics
}

export interface WeightAnalytics {
  firstWeightKgInRange: number | null
  lastWeightKgInRange: number | null
  weightChangeKg: number | null
  weightChangePercentage: number | null
  lowestWeightKg: number | null
  highestWeightKg: number | null
  averageWeightKg: number | null
  targetWeightKg: number | null
  remainingWeightKg: number | null
  progressAtEndOfRangePercentage: number | null
  recordedDays: number
  totalDaysInRange: number
  weightDataPoints: WeightDataPoint[]
}

export interface WeightDataPoint {
  date: string
  weightKg: number
}

export interface NutritionAnalytics {
  totalCalories: number
  averageCaloriesPerLoggedDay: number | null
  averageProteinGramsPerLoggedDay: number | null
  averageCarbohydrateGramsPerLoggedDay: number | null
  averageFatGramsPerLoggedDay: number | null
  totalDaysInRange: number
  daysWithFoodLogs: number
  daysWithoutFoodLogs: number
  currentMaintenanceCaloriesEstimate: number | null
  daysBelowMaintenance: number | null
  daysAtOrAboveMaintenance: number | null
  dailyNutritionDataPoints: DailyNutritionDataPoint[]
}

export interface DailyNutritionDataPoint {
  date: string
  totalCalories: number
  totalProteinGrams: number
  totalCarbohydrateGrams: number
  totalFatGrams: number
  foodEntryCount: number
}
