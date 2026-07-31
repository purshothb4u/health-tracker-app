import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createSleepEntry,
  deleteSleepEntry,
  fetchDailySleepSummary,
  fetchSleepEntries,
  updateSleepEntry,
} from '../api/sleepTrackingApi'
import type {
  DailySleepSummary,
  SleepEntry,
  SleepEntryRequest,
  SleepType,
} from '../types/SleepTracking'

interface UseSleepTrackingResult {
  selectedDate: string
  setSelectedDate: (date: string) => void
  entries: SleepEntry[]
  summary: DailySleepSummary | null
  loading: boolean
  mutating: boolean
  error: string | null
  reload: () => void
  createEntry: (data: SleepEntryRequest) => Promise<SleepEntry>
  updateEntry: (sleepEntryId: number, data: SleepEntryRequest) => Promise<SleepEntry>
  deleteEntry: (sleepEntryId: number) => Promise<void>
}

const SLEEP_TYPES: SleepType[] = ['NIGHT_SLEEP', 'NAP', 'OTHER']

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

function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
    value,
  )
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = match[6] === undefined ? 0 : Number(match[6])
  const millisecond = match[7] === undefined ? 0 : Number(match[7].padEnd(3, '0'))
  const dateTime = new Date(year, month - 1, day, hour, minute, second, millisecond)

  return dateTime.getFullYear() === year
    && dateTime.getMonth() === month - 1
    && dateTime.getDate() === day
    && dateTime.getHours() === hour
    && dateTime.getMinutes() === minute
    && dateTime.getSeconds() === second
    && dateTime.getMilliseconds() === millisecond
    ? dateTime
    : null
}

function validateSelectedDate(selectedDate: string): string | null {
  if (!selectedDate) {
    return 'A sleep date is required.'
  }

  const date = parseLocalDate(selectedDate)
  if (date === null) {
    return 'Sleep date must use the YYYY-MM-DD format.'
  }

  const today = parseLocalDate(getInitialSelectedDate())
  return today !== null && date > today ? 'Sleep date must not be in the future.' : null
}

function validateSleepEntry(data: SleepEntryRequest): string | null {
  const dateError = validateSelectedDate(data.sleepDate)
  if (dateError !== null) {
    return dateError
  }
  if (!data.sleepType) {
    return 'A sleep type is required.'
  }
  if (!SLEEP_TYPES.includes(data.sleepType)) {
    return 'Sleep type must be Night sleep, Nap, or Other.'
  }
  if (!data.startDateTime) {
    return 'A start date and time is required.'
  }
  if (!data.endDateTime) {
    return 'An end date and time is required.'
  }

  const startDateTime = parseLocalDateTime(data.startDateTime)
  if (startDateTime === null) {
    return 'Start date and time is invalid.'
  }
  const endDateTime = parseLocalDateTime(data.endDateTime)
  if (endDateTime === null) {
    return 'End date and time is invalid.'
  }
  if (endDateTime <= startDateTime) {
    return 'End date and time must be after start date and time.'
  }
  if (endDateTime > new Date()) {
    return 'End date and time must not be in the future.'
  }
  if (data.sleepDate !== formatLocalDate(endDateTime)) {
    return 'Sleep date must match the end date.'
  }

  const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60_000
  if (durationMinutes < 1) {
    return 'Sleep duration must be at least 1 minute.'
  }
  if (durationMinutes > 1_440) {
    return 'Sleep duration must not exceed 1,440 minutes.'
  }
  if (
    data.qualityRating !== null
    && data.qualityRating !== undefined
    && (!Number.isInteger(data.qualityRating)
      || data.qualityRating < 1
      || data.qualityRating > 5)
  ) {
    return 'Quality rating must be between 1 and 5.'
  }
  if (data.notes !== null && data.notes !== undefined && data.notes.length > 500) {
    return 'Notes must not exceed 500 characters.'
  }

  return null
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof ApiError ? error.message : fallbackMessage
}

export function useSleepTracking(userProfileId: number | null): UseSleepTrackingResult {
  const [selectedDate, setSelectedDateState] = useState(getInitialSelectedDate)
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [summary, setSummary] = useState<DailySleepSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)
  const mutationInProgress = useRef(false)
  const mounted = useRef(true)
  const currentUserProfileId = useRef(userProfileId)
  const currentSelectedDate = useRef(selectedDate)

  currentUserProfileId.current = userProfileId
  currentSelectedDate.current = selectedDate

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestSequence.current += 1
    }
  }, [])

  const setSelectedDate = useCallback((date: string) => {
    requestSequence.current += 1
    currentSelectedDate.current = date
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
    const selectedSleepDate = selectedDate
    let cancelled = false

    async function loadSleepData() {
      setLoading(true)
      setError(null)

      try {
        const [entryData, summaryData] = await Promise.all([
          fetchSleepEntries(selectedUserProfileId, selectedSleepDate),
          fetchDailySleepSummary(selectedUserProfileId, selectedSleepDate),
        ])
        if (
          !cancelled
          && mounted.current
          && currentRequest === requestSequence.current
          && currentUserProfileId.current === selectedUserProfileId
          && currentSelectedDate.current === selectedSleepDate
        ) {
          setEntries(entryData)
          setSummary(summaryData)
          setError(null)
        }
      } catch (err) {
        if (
          !cancelled
          && mounted.current
          && currentRequest === requestSequence.current
          && currentUserProfileId.current === selectedUserProfileId
          && currentSelectedDate.current === selectedSleepDate
        ) {
          setError(getErrorMessage(err, 'Failed to load sleep tracking data'))
        }
      } finally {
        if (
          !cancelled
          && mounted.current
          && currentRequest === requestSequence.current
          && currentUserProfileId.current === selectedUserProfileId
          && currentSelectedDate.current === selectedSleepDate
        ) {
          setLoading(false)
        }
      }
    }

    void loadSleepData()

    return () => {
      cancelled = true
    }
  }, [reloadToken, selectedDate, userProfileId])

  const beginMutation = useCallback(() => {
    if (userProfileId === null) {
      const profileError = new Error('A user profile is required for sleep tracking')
      setError(profileError.message)
      throw profileError
    }
    if (mutationInProgress.current) {
      const mutationError = new Error('A sleep tracking update is already in progress')
      setError(mutationError.message)
      throw mutationError
    }

    mutationInProgress.current = true
    setMutating(true)
    setError(null)
    return userProfileId
  }, [userProfileId])

  const createEntry = useCallback(
    async (data: SleepEntryRequest): Promise<SleepEntry> => {
      const validationError = validateSleepEntry(data)
      if (validationError !== null) {
        setError(validationError)
        throw new Error(validationError)
      }

      const selectedUserProfileId = beginMutation()
      try {
        const entry = await createSleepEntry(selectedUserProfileId, data)
        if (mounted.current && currentUserProfileId.current === selectedUserProfileId) {
          reload()
        }
        return entry
      } catch (err) {
        if (mounted.current && currentUserProfileId.current === selectedUserProfileId) {
          setError(getErrorMessage(err, 'Failed to create sleep entry'))
        }
        throw err
      } finally {
        mutationInProgress.current = false
        if (mounted.current) {
          setMutating(false)
        }
      }
    },
    [beginMutation, reload],
  )

  const updateEntry = useCallback(
    async (sleepEntryId: number, data: SleepEntryRequest): Promise<SleepEntry> => {
      const validationError = validateSleepEntry(data)
      if (validationError !== null) {
        setError(validationError)
        throw new Error(validationError)
      }

      const selectedUserProfileId = beginMutation()
      try {
        const entry = await updateSleepEntry(selectedUserProfileId, sleepEntryId, data)
        if (mounted.current && currentUserProfileId.current === selectedUserProfileId) {
          reload()
        }
        return entry
      } catch (err) {
        if (mounted.current && currentUserProfileId.current === selectedUserProfileId) {
          setError(getErrorMessage(err, 'Failed to update sleep entry'))
        }
        throw err
      } finally {
        mutationInProgress.current = false
        if (mounted.current) {
          setMutating(false)
        }
      }
    },
    [beginMutation, reload],
  )

  const deleteEntry = useCallback(
    async (sleepEntryId: number): Promise<void> => {
      const selectedUserProfileId = beginMutation()
      try {
        await deleteSleepEntry(selectedUserProfileId, sleepEntryId)
        if (mounted.current && currentUserProfileId.current === selectedUserProfileId) {
          reload()
        }
      } catch (err) {
        if (mounted.current && currentUserProfileId.current === selectedUserProfileId) {
          setError(getErrorMessage(err, 'Failed to delete sleep entry'))
        }
        throw err
      } finally {
        mutationInProgress.current = false
        if (mounted.current) {
          setMutating(false)
        }
      }
    },
    [beginMutation, reload],
  )

  return {
    selectedDate,
    setSelectedDate,
    entries,
    summary,
    loading,
    mutating,
    error,
    reload,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
