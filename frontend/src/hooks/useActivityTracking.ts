import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createActivityEntry,
  deleteActivityEntry,
  fetchActivityEntries,
  fetchDailyActivitySummary,
  updateActivityEntry,
} from '../api/activityTrackingApi'
import type {
  ActivityEntry,
  ActivityEntryRequest,
  DailyActivitySummary,
} from '../types/ActivityTracking'

interface UseActivityTrackingResult {
  selectedDate: string
  setSelectedDate: (date: string) => void
  entries: ActivityEntry[]
  summary: DailyActivitySummary | null
  loading: boolean
  mutating: boolean
  error: string | null
  reload: () => void
  createEntry: (data: ActivityEntryRequest) => Promise<ActivityEntry>
  updateEntry: (activityEntryId: number, data: ActivityEntryRequest) => Promise<ActivityEntry>
  deleteEntry: (activityEntryId: number) => Promise<void>
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getInitialSelectedDate(): string {
  return formatLocalDate(new Date())
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

function validateSelectedDate(selectedDate: string): string | null {
  if (!selectedDate) {
    return 'A date is required.'
  }

  const date = parseLocalDate(selectedDate)
  if (date === null) {
    return 'Date must use the YYYY-MM-DD format.'
  }

  const today = parseLocalDate(getInitialSelectedDate())
  return today !== null && date > today ? 'Date must not be in the future.' : null
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof ApiError ? error.message : fallbackMessage
}

export function useActivityTracking(userProfileId: number | null): UseActivityTrackingResult {
  const [selectedDate, setSelectedDateState] = useState(getInitialSelectedDate)
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [summary, setSummary] = useState<DailyActivitySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)
  const mutationInProgress = useRef(false)

  const setSelectedDate = useCallback((date: string) => {
    requestSequence.current += 1
    setSelectedDateState(date)
  }, [])

  const reload = useCallback(() => {
    requestSequence.current += 1
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const currentRequest = ++requestSequence.current

    if (userProfileId === null) {
      setEntries([])
      setSummary(null)
      setLoading(false)
      setMutating(false)
      setError(null)
      return
    }

    const dateError = validateSelectedDate(selectedDate)
    if (dateError !== null) {
      setLoading(false)
      setError(dateError)
      return
    }

    const selectedUserProfileId = userProfileId
    const selectedActivityDate = selectedDate
    let cancelled = false

    async function loadActivityData() {
      setLoading(true)
      setError(null)

      try {
        const [entryData, summaryData] = await Promise.all([
          fetchActivityEntries(selectedUserProfileId, selectedActivityDate),
          fetchDailyActivitySummary(selectedUserProfileId, selectedActivityDate),
        ])
        if (!cancelled && currentRequest === requestSequence.current) {
          setEntries(entryData)
          setSummary(summaryData)
          setError(null)
        }
      } catch (err) {
        if (!cancelled && currentRequest === requestSequence.current) {
          setError(getErrorMessage(err, 'Failed to load activity tracking data'))
        }
      } finally {
        if (!cancelled && currentRequest === requestSequence.current) {
          setLoading(false)
        }
      }
    }

    void loadActivityData()

    return () => {
      cancelled = true
    }
  }, [reloadToken, selectedDate, userProfileId])

  const beginMutation = useCallback(() => {
    if (userProfileId === null) {
      const profileError = new Error('A user profile is required for activity tracking')
      throw profileError
    }
    if (mutationInProgress.current) {
      const mutationError = new Error('An activity tracking update is already in progress')
      throw mutationError
    }

    mutationInProgress.current = true
    setMutating(true)
    return userProfileId
  }, [userProfileId])

  const createEntry = useCallback(
    async (data: ActivityEntryRequest): Promise<ActivityEntry> => {
      const dateError = validateSelectedDate(data.activityDate)
      if (dateError !== null) {
        throw new Error(dateError)
      }

      const selectedUserProfileId = beginMutation()
      try {
        const entry = await createActivityEntry(selectedUserProfileId, data)
        reload()
        return entry
      } finally {
        mutationInProgress.current = false
        setMutating(false)
      }
    },
    [beginMutation, reload],
  )

  const updateEntry = useCallback(
    async (activityEntryId: number, data: ActivityEntryRequest): Promise<ActivityEntry> => {
      const dateError = validateSelectedDate(data.activityDate)
      if (dateError !== null) {
        throw new Error(dateError)
      }

      const selectedUserProfileId = beginMutation()
      try {
        const entry = await updateActivityEntry(selectedUserProfileId, activityEntryId, data)
        reload()
        return entry
      } finally {
        mutationInProgress.current = false
        setMutating(false)
      }
    },
    [beginMutation, reload],
  )

  const deleteEntry = useCallback(
    async (activityEntryId: number): Promise<void> => {
      const selectedUserProfileId = beginMutation()
      try {
        await deleteActivityEntry(selectedUserProfileId, activityEntryId)
        reload()
      } finally {
        mutationInProgress.current = false
        setMutating(false)
      }
    },
    [beginMutation, reload],
  )

  const dataMatchesContext = summary !== null
    && userProfileId !== null
    && summary.userProfileId === userProfileId
    && summary.activityDate === selectedDate

  return {
    selectedDate,
    setSelectedDate,
    entries: dataMatchesContext ? entries : [],
    summary: dataMatchesContext ? summary : null,
    loading,
    mutating,
    error,
    reload,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
