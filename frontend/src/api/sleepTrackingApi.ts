import { del, get, post, put } from './client'
import type {
  DailySleepSummary,
  SleepEntry,
  SleepEntryRequest,
} from '../types/SleepTracking'

function sleepEntriesPath(userProfileId: number): string {
  return `/api/users/${userProfileId}/sleep-entries`
}

function dateQuery(date: string): string {
  return `?date=${encodeURIComponent(date)}`
}

export function fetchSleepEntries(
  userProfileId: number,
  date: string,
): Promise<SleepEntry[]> {
  return get<SleepEntry[]>(`${sleepEntriesPath(userProfileId)}${dateQuery(date)}`)
}

export function fetchSleepEntry(
  userProfileId: number,
  sleepEntryId: number,
): Promise<SleepEntry> {
  return get<SleepEntry>(`${sleepEntriesPath(userProfileId)}/${sleepEntryId}`)
}

export function createSleepEntry(
  userProfileId: number,
  data: SleepEntryRequest,
): Promise<SleepEntry> {
  return post<SleepEntry>(sleepEntriesPath(userProfileId), data)
}

export function updateSleepEntry(
  userProfileId: number,
  sleepEntryId: number,
  data: SleepEntryRequest,
): Promise<SleepEntry> {
  return put<SleepEntry>(`${sleepEntriesPath(userProfileId)}/${sleepEntryId}`, data)
}

export function deleteSleepEntry(
  userProfileId: number,
  sleepEntryId: number,
): Promise<void> {
  return del<void>(`${sleepEntriesPath(userProfileId)}/${sleepEntryId}`)
}

export function fetchDailySleepSummary(
  userProfileId: number,
  date: string,
): Promise<DailySleepSummary> {
  return get<DailySleepSummary>(
    `/api/users/${userProfileId}/sleep-summary${dateQuery(date)}`,
  )
}
