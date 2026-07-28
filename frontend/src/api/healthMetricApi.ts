import { get, post, put } from './client'
import type { HealthMetric, HealthMetricRequest, HealthSummary } from '../types/HealthMetric'

function metricsPath(userProfileId: number): string {
  return `/api/users/${userProfileId}/metrics`
}

export function fetchHealthMetrics(userProfileId: number): Promise<HealthMetric[]> {
  return get<HealthMetric[]>(metricsPath(userProfileId))
}

export function fetchLatestHealthMetric(userProfileId: number): Promise<HealthMetric> {
  return get<HealthMetric>(`${metricsPath(userProfileId)}/latest`)
}

export function fetchHealthSummary(userProfileId: number): Promise<HealthSummary> {
  return get<HealthSummary>(`/api/users/${userProfileId}/summary`)
}

export function createHealthMetric(
  userProfileId: number,
  data: HealthMetricRequest,
): Promise<HealthMetric> {
  return post<HealthMetric>(metricsPath(userProfileId), data)
}

export function updateHealthMetric(
  userProfileId: number,
  metricId: number,
  data: HealthMetricRequest,
): Promise<HealthMetric> {
  return put<HealthMetric>(`${metricsPath(userProfileId)}/${metricId}`, data)
}
