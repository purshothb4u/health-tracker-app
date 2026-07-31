import { del, get, post, put } from './client'
import type {
  ActivityEntry,
  ActivityEntryRequest,
  DailyActivitySummary,
} from '../types/ActivityTracking'

function activityEntriesPath(userProfileId: number): string {
  return `/api/users/${userProfileId}/activity-entries`
}

function dateQuery(date: string): string {
  return `?date=${encodeURIComponent(date)}`
}

export function fetchActivityEntries(
  userProfileId: number,
  date: string,
): Promise<ActivityEntry[]> {
  return get<ActivityEntry[]>(`${activityEntriesPath(userProfileId)}${dateQuery(date)}`)
}

export function fetchActivityEntry(
  userProfileId: number,
  activityEntryId: number,
): Promise<ActivityEntry> {
  return get<ActivityEntry>(`${activityEntriesPath(userProfileId)}/${activityEntryId}`)
}

export function createActivityEntry(
  userProfileId: number,
  data: ActivityEntryRequest,
): Promise<ActivityEntry> {
  return post<ActivityEntry>(activityEntriesPath(userProfileId), data)
}

export function updateActivityEntry(
  userProfileId: number,
  activityEntryId: number,
  data: ActivityEntryRequest,
): Promise<ActivityEntry> {
  return put<ActivityEntry>(`${activityEntriesPath(userProfileId)}/${activityEntryId}`, data)
}

export function deleteActivityEntry(
  userProfileId: number,
  activityEntryId: number,
): Promise<void> {
  return del<void>(`${activityEntriesPath(userProfileId)}/${activityEntryId}`)
}

export function fetchDailyActivitySummary(
  userProfileId: number,
  date: string,
): Promise<DailyActivitySummary> {
  return get<DailyActivitySummary>(
    `/api/users/${userProfileId}/activity-summary${dateQuery(date)}`,
  )
}
