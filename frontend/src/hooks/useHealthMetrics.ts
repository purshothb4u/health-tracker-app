import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { fetchHealthMetrics, fetchHealthSummary } from '../api/healthMetricApi'
import type { HealthMetric, HealthSummary } from '../types/HealthMetric'

interface UseHealthMetricsResult {
  metrics: HealthMetric[]
  summary: HealthSummary | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useHealthMetrics(userProfileId: number | null): UseHealthMetricsResult {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [summary, setSummary] = useState<HealthSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    if (userProfileId === null) {
      setMetrics([])
      setSummary(null)
      setLoading(false)
      setError(null)
      return
    }

    const selectedUserProfileId = userProfileId
    let cancelled = false

    async function loadHealthData() {
      setLoading(true)
      setError(null)

      try {
        const [metricData, summaryData] = await Promise.all([
          fetchHealthMetrics(selectedUserProfileId),
          fetchHealthSummary(selectedUserProfileId),
        ])
        if (!cancelled) {
          setMetrics(metricData)
          setSummary(summaryData)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Failed to load health metrics'
          setError(message)
          setMetrics([])
          setSummary(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHealthData()

    return () => {
      cancelled = true
    }
  }, [userProfileId, reloadToken])

  return { metrics, summary, loading, error, reload }
}
