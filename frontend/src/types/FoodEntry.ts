export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export interface FoodEntry {
  id: number
  userProfileId: number
  entryDate: string
  mealType: MealType
  foodName: string
  quantity: number
  unit: string
  calories: number
  proteinGrams: number
  carbohydrateGrams: number
  fatGrams: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface FoodEntryRequest {
  entryDate: string
  mealType: MealType
  foodName: string
  quantity: number
  unit: string
  calories: number
  proteinGrams: number
  carbohydrateGrams: number
  fatGrams: number
  notes?: string
}

export interface DailyNutritionSummary {
  userProfileId: number
  entryDate: string
  totalCalories: number
  totalProteinGrams: number
  totalCarbohydrateGrams: number
  totalFatGrams: number
  maintenanceCalories: number | null
  remainingCalories: number | null
}
