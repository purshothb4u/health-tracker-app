import { useEffect, useState } from 'react'
import { ApiError, getBackendStatus } from '../api/client'
import type { StatusResponse } from '../types/api'

interface UseBackendStatusResult {
  data: StatusResponse | null
  loading: boolean
  error: string | null
  connected: boolean
}

export function useBackendStatus(): UseBackendStatusResult {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      setLoading(true)
      setError(null)

      try {
        const response = await getBackendStatus()
        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? `Unable to reach backend (${err.status ?? 'network error'})`
              : 'Unable to reach backend'
          setError(message)
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const connected =
    data?.message === 'Health Tracker Backend Running'

  return { data, loading, error, connected }
}
