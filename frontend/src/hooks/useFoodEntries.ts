import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createFoodEntry,
  deleteFoodEntry,
  fetchDailyNutritionSummary,
  fetchFoodEntries,
  updateFoodEntry,
} from '../api/foodEntryApi'
import type { DailyNutritionSummary, FoodEntry, FoodEntryRequest } from '../types/FoodEntry'

interface UseFoodEntriesResult {
  entries: FoodEntry[]
  summary: DailyNutritionSummary | null
  loading: boolean
  mutating: boolean
  error: string | null
  selectedDate: string
  setSelectedDate: (date: string) => void
  reload: () => void
  create: (data: FoodEntryRequest) => Promise<FoodEntry>
  update: (foodEntryId: number, data: FoodEntryRequest) => Promise<FoodEntry>
  remove: (foodEntryId: number) => Promise<void>
}

function getInitialSelectedDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof ApiError ? error.message : fallbackMessage
}

export function useFoodEntries(userProfileId: number | null): UseFoodEntriesResult {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(getInitialSelectedDate)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    if (userProfileId === null || !selectedDate) {
      setEntries([])
      setSummary(null)
      setLoading(false)
      setError(null)
      return
    }

    const selectedUserProfileId = userProfileId
    const selectedEntryDate = selectedDate
    let cancelled = false

    async function loadFoodData() {
      setLoading(true)
      setError(null)

      try {
        const [entryData, summaryData] = await Promise.all([
          fetchFoodEntries(selectedUserProfileId, selectedEntryDate),
          fetchDailyNutritionSummary(selectedUserProfileId, selectedEntryDate),
        ])
        if (!cancelled) {
          setEntries(entryData)
          setSummary(summaryData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load food entries'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFoodData()

    return () => {
      cancelled = true
    }
  }, [userProfileId, selectedDate, reloadToken])

  const create = useCallback(
    async (data: FoodEntryRequest): Promise<FoodEntry> => {
      if (userProfileId === null) {
        const profileError = new Error('A user profile is required to create a food entry')
        setError(profileError.message)
        throw profileError
      }

      setMutating(true)
      setError(null)
      try {
        const foodEntry = await createFoodEntry(userProfileId, data)
        reload()
        return foodEntry
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to create food entry'))
        throw err
      } finally {
        setMutating(false)
      }
    },
    [reload, userProfileId],
  )

  const update = useCallback(
    async (foodEntryId: number, data: FoodEntryRequest): Promise<FoodEntry> => {
      if (userProfileId === null) {
        const profileError = new Error('A user profile is required to update a food entry')
        setError(profileError.message)
        throw profileError
      }

      setMutating(true)
      setError(null)
      try {
        const foodEntry = await updateFoodEntry(userProfileId, foodEntryId, data)
        reload()
        return foodEntry
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to update food entry'))
        throw err
      } finally {
        setMutating(false)
      }
    },
    [reload, userProfileId],
  )

  const remove = useCallback(
    async (foodEntryId: number): Promise<void> => {
      if (userProfileId === null) {
        const profileError = new Error('A user profile is required to delete a food entry')
        setError(profileError.message)
        throw profileError
      }

      setMutating(true)
      setError(null)
      try {
        await deleteFoodEntry(userProfileId, foodEntryId)
        reload()
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to delete food entry'))
        throw err
      } finally {
        setMutating(false)
      }
    },
    [reload, userProfileId],
  )

  return {
    entries,
    summary,
    loading,
    mutating,
    error,
    selectedDate,
    setSelectedDate,
    reload,
    create,
    update,
    remove,
  }
}
