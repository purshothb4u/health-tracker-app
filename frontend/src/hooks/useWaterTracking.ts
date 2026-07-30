import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createWaterEntry,
  deleteWaterEntry,
  fetchHydrationSummary,
  fetchWaterEntries,
  fetchWaterGoal,
  updateWaterEntry,
  updateWaterGoal,
} from '../api/waterTrackingApi'
import type {
  HydrationSummary,
  WaterEntry,
  WaterEntryRequest,
  WaterGoal,
  WaterGoalRequest,
} from '../types/WaterTracking'

interface UseWaterTrackingResult {
  selectedDate: string
  setSelectedDate: (date: string) => void
  entries: WaterEntry[]
  goal: WaterGoal | null
  summary: HydrationSummary | null
  loading: boolean
  mutating: boolean
  error: string | null
  reload: () => void
  createEntry: (data: WaterEntryRequest) => Promise<WaterEntry>
  updateEntry: (waterEntryId: number, data: WaterEntryRequest) => Promise<WaterEntry>
  deleteEntry: (waterEntryId: number) => Promise<void>
  updateGoal: (data: WaterGoalRequest) => Promise<WaterGoal>
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

export function useWaterTracking(userProfileId: number | null): UseWaterTrackingResult {
  const [selectedDate, setSelectedDate] = useState(getInitialSelectedDate)
  const [entries, setEntries] = useState<WaterEntry[]>([])
  const [goal, setGoal] = useState<WaterGoal | null>(null)
  const [summary, setSummary] = useState<HydrationSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)
  const mutationInProgress = useRef(false)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const currentRequest = ++requestSequence.current

    if (userProfileId === null) {
      setEntries([])
      setGoal(null)
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
    const selectedEntryDate = selectedDate
    let cancelled = false

    async function loadWaterData() {
      setLoading(true)
      setError(null)

      try {
        const [entryData, goalData, summaryData] = await Promise.all([
          fetchWaterEntries(selectedUserProfileId, selectedEntryDate),
          fetchWaterGoal(selectedUserProfileId),
          fetchHydrationSummary(selectedUserProfileId, selectedEntryDate),
        ])
        if (!cancelled && currentRequest === requestSequence.current) {
          setEntries(entryData)
          setGoal(goalData)
          setSummary(summaryData)
        }
      } catch (err) {
        if (!cancelled && currentRequest === requestSequence.current) {
          setError(getErrorMessage(err, 'Failed to load water tracking data'))
        }
      } finally {
        if (!cancelled && currentRequest === requestSequence.current) {
          setLoading(false)
        }
      }
    }

    void loadWaterData()

    return () => {
      cancelled = true
    }
  }, [reloadToken, selectedDate, userProfileId])

  const beginMutation = useCallback(() => {
    if (userProfileId === null) {
      const profileError = new Error('A user profile is required for water tracking')
      setError(profileError.message)
      throw profileError
    }
    if (mutationInProgress.current) {
      const mutationError = new Error('A water tracking update is already in progress')
      setError(mutationError.message)
      throw mutationError
    }

    mutationInProgress.current = true
    setMutating(true)
    setError(null)
    return userProfileId
  }, [userProfileId])

  const createEntry = useCallback(
    async (data: WaterEntryRequest): Promise<WaterEntry> => {
      const dateError = validateSelectedDate(data.entryDate)
      if (dateError !== null) {
        setError(dateError)
        throw new Error(dateError)
      }

      const selectedUserProfileId = beginMutation()
      try {
        const entry = await createWaterEntry(selectedUserProfileId, data)
        reload()
        return entry
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to create water entry'))
        throw err
      } finally {
        mutationInProgress.current = false
        setMutating(false)
      }
    },
    [beginMutation, reload],
  )

  const updateEntry = useCallback(
    async (waterEntryId: number, data: WaterEntryRequest): Promise<WaterEntry> => {
      const dateError = validateSelectedDate(data.entryDate)
      if (dateError !== null) {
        setError(dateError)
        throw new Error(dateError)
      }

      const selectedUserProfileId = beginMutation()
      try {
        const entry = await updateWaterEntry(selectedUserProfileId, waterEntryId, data)
        reload()
        return entry
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to update water entry'))
        throw err
      } finally {
        mutationInProgress.current = false
        setMutating(false)
      }
    },
    [beginMutation, reload],
  )

  const deleteEntry = useCallback(
    async (waterEntryId: number): Promise<void> => {
      const selectedUserProfileId = beginMutation()
      try {
        await deleteWaterEntry(selectedUserProfileId, waterEntryId)
        reload()
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to delete water entry'))
        throw err
      } finally {
        mutationInProgress.current = false
        setMutating(false)
      }
    },
    [beginMutation, reload],
  )

  const updateGoal = useCallback(
    async (data: WaterGoalRequest): Promise<WaterGoal> => {
      const selectedUserProfileId = beginMutation()
      try {
        const updatedGoal = await updateWaterGoal(selectedUserProfileId, data)
        reload()
        return updatedGoal
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to update water goal'))
        throw err
      } finally {
        mutationInProgress.current = false
        setMutating(false)
      }
    },
    [beginMutation, reload],
  )

  return {
    selectedDate,
    setSelectedDate,
    entries,
    goal,
    summary,
    loading,
    mutating,
    error,
    reload,
    createEntry,
    updateEntry,
    deleteEntry,
    updateGoal,
  }
}
