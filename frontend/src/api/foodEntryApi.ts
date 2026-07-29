import { del, get, post, put } from './client'
import type { DailyNutritionSummary, FoodEntry, FoodEntryRequest } from '../types/FoodEntry'

function foodEntriesPath(userProfileId: number): string {
  return `/api/users/${userProfileId}/food-entries`
}

function dateQuery(date: string): string {
  return `?date=${encodeURIComponent(date)}`
}

export function fetchFoodEntries(userProfileId: number, date: string): Promise<FoodEntry[]> {
  return get<FoodEntry[]>(`${foodEntriesPath(userProfileId)}${dateQuery(date)}`)
}

export function fetchFoodEntry(userProfileId: number, foodEntryId: number): Promise<FoodEntry> {
  return get<FoodEntry>(`${foodEntriesPath(userProfileId)}/${foodEntryId}`)
}

export function createFoodEntry(
  userProfileId: number,
  data: FoodEntryRequest,
): Promise<FoodEntry> {
  return post<FoodEntry>(foodEntriesPath(userProfileId), data)
}

export function updateFoodEntry(
  userProfileId: number,
  foodEntryId: number,
  data: FoodEntryRequest,
): Promise<FoodEntry> {
  return put<FoodEntry>(`${foodEntriesPath(userProfileId)}/${foodEntryId}`, data)
}

export function deleteFoodEntry(userProfileId: number, foodEntryId: number): Promise<void> {
  return del<void>(`${foodEntriesPath(userProfileId)}/${foodEntryId}`)
}

export function fetchDailyNutritionSummary(
  userProfileId: number,
  date: string,
): Promise<DailyNutritionSummary> {
  return get<DailyNutritionSummary>(`/api/users/${userProfileId}/nutrition-summary${dateQuery(date)}`)
}
