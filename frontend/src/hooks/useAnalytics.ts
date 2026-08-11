import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import { fetchAnalytics } from '../api/analyticsApi'
import type { AnalyticsResponse } from '../types/Analytics'

export type AnalyticsPreset = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM'

interface DateRange {
  fromDate: string
  toDate: string
}

interface UseAnalyticsResult {
  fromDate: string
  toDate: string
  selectedPreset: AnalyticsPreset
  analytics: AnalyticsResponse | null
  loading: boolean
  error: string | null
  rangeError: string | null
  selectPreset: (preset: Exclude<AnalyticsPreset, 'CUSTOM'>) => void
  setCustomRange: (fromDate: string, toDate: string) => void
  setFromDate: (fromDate: string) => void
  setToDate: (toDate: string) => void
  reload: () => void
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const MAXIMUM_RANGE_DAYS = 365

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayLocalDate(): string {
  return formatLocalDate(new Date())
}

function getPresetRange(preset: Exclude<AnalyticsPreset, 'CUSTOM'>): DateRange {
  const daysInRange = preset === 'LAST_7_DAYS' ? 7 : preset === 'LAST_30_DAYS' ? 30 : 90
  const today = new Date()
  const fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (daysInRange - 1))

  return {
    fromDate: formatLocalDate(fromDate),
    toDate: formatLocalDate(today),
  }
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null
}

function getUtcDayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MILLISECONDS_PER_DAY
}

function validateDateRange(fromDate: string, toDate: string): string | null {
  if (!fromDate) {
    return 'From date is required.'
  }
  if (!toDate) {
    return 'To date is required.'
  }

  const from = parseLocalDate(fromDate)
  const to = parseLocalDate(toDate)
  if (from === null || to === null) {
    return 'Dates must use the YYYY-MM-DD format.'
  }
  if (from > to) {
    return 'From date must not be after to date.'
  }

  const today = parseLocalDate(getTodayLocalDate())
  if (today !== null && to > today) {
    return 'To date must not be in the future.'
  }

  const inclusiveDays = getUtcDayNumber(to) - getUtcDayNumber(from) + 1
  return inclusiveDays > MAXIMUM_RANGE_DAYS
    ? 'Analytics date range must not exceed 365 days.'
    : null
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Failed to load analytics'
}

export function useAnalytics(userProfileId: number | null): UseAnalyticsResult {
  const initialRange = useMemo(() => getPresetRange('LAST_30_DAYS'), [])
  const [fromDate, setFromDateState] = useState(initialRange.fromDate)
  const [toDate, setToDateState] = useState(initialRange.toDate)
  const [selectedPreset, setSelectedPreset] = useState<AnalyticsPreset>('LAST_30_DAYS')
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const rangeError = useMemo(() => validateDateRange(fromDate, toDate), [fromDate, toDate])

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  const selectPreset = useCallback((preset: Exclude<AnalyticsPreset, 'CUSTOM'>) => {
    const range = getPresetRange(preset)
    setFromDateState(range.fromDate)
    setToDateState(range.toDate)
    setSelectedPreset(preset)
    setError(null)
  }, [])

  const setCustomRange = useCallback((nextFromDate: string, nextToDate: string) => {
    setFromDateState(nextFromDate)
    setToDateState(nextToDate)
    setSelectedPreset('CUSTOM')
    setError(null)
  }, [])

  const setFromDate = useCallback((nextFromDate: string) => {
    setFromDateState(nextFromDate)
    setSelectedPreset('CUSTOM')
    setError(null)
  }, [])

  const setToDate = useCallback((nextToDate: string) => {
    setToDateState(nextToDate)
    setSelectedPreset('CUSTOM')
    setError(null)
  }, [])

  useEffect(() => {
    if (userProfileId === null) {
      setAnalytics(null)
      setLoading(false)
      setError(null)
      return
    }

    if (rangeError !== null) {
      setLoading(false)
      setError(null)
      return
    }

    const selectedUserProfileId = userProfileId
    const selectedFromDate = fromDate
    const selectedToDate = toDate
    let cancelled = false

    async function loadAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchAnalytics(selectedUserProfileId, selectedFromDate, selectedToDate)
        if (!cancelled) {
          setAnalytics(response)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAnalytics()

    return () => {
      cancelled = true
    }
  }, [fromDate, rangeError, reloadToken, toDate, userProfileId])

  return {
    fromDate,
    toDate,
    selectedPreset,
    analytics,
    loading,
    error,
    rangeError,
    selectPreset,
    setCustomRange,
    setFromDate,
    setToDate,
    reload,
  }
}
