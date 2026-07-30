import { del, get, post, put } from './client'
import type {
  HydrationSummary,
  WaterEntry,
  WaterEntryRequest,
  WaterGoal,
  WaterGoalRequest,
} from '../types/WaterTracking'

function waterEntriesPath(userProfileId: number): string {
  return `/api/users/${userProfileId}/water-entries`
}

function waterGoalPath(userProfileId: number): string {
  return `/api/users/${userProfileId}/water-goal`
}

function dateQuery(date: string): string {
  return `?date=${encodeURIComponent(date)}`
}

export function fetchWaterGoal(userProfileId: number): Promise<WaterGoal> {
  return get<WaterGoal>(waterGoalPath(userProfileId))
}

export function updateWaterGoal(userProfileId: number, data: WaterGoalRequest): Promise<WaterGoal> {
  return put<WaterGoal>(waterGoalPath(userProfileId), data)
}

export function fetchWaterEntries(userProfileId: number, date: string): Promise<WaterEntry[]> {
  return get<WaterEntry[]>(`${waterEntriesPath(userProfileId)}${dateQuery(date)}`)
}

export function fetchWaterEntry(userProfileId: number, waterEntryId: number): Promise<WaterEntry> {
  return get<WaterEntry>(`${waterEntriesPath(userProfileId)}/${waterEntryId}`)
}

export function createWaterEntry(
  userProfileId: number,
  data: WaterEntryRequest,
): Promise<WaterEntry> {
  return post<WaterEntry>(waterEntriesPath(userProfileId), data)
}

export function updateWaterEntry(
  userProfileId: number,
  waterEntryId: number,
  data: WaterEntryRequest,
): Promise<WaterEntry> {
  return put<WaterEntry>(`${waterEntriesPath(userProfileId)}/${waterEntryId}`, data)
}

export function deleteWaterEntry(userProfileId: number, waterEntryId: number): Promise<void> {
  return del<void>(`${waterEntriesPath(userProfileId)}/${waterEntryId}`)
}

export function fetchHydrationSummary(userProfileId: number, date: string): Promise<HydrationSummary> {
  return get<HydrationSummary>(`/api/users/${userProfileId}/hydration-summary${dateQuery(date)}`)
}
