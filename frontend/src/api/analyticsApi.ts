import { get } from './client'
import type { AnalyticsResponse } from '../types/Analytics'

export function fetchAnalytics(
  userProfileId: number,
  fromDate: string,
  toDate: string,
): Promise<AnalyticsResponse> {
  const query = `?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`
  return get<AnalyticsResponse>(`/api/users/${userProfileId}/analytics${query}`)
}
