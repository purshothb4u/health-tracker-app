import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createGoal as createGoalRequest,
  deleteGoal as deleteGoalRequest,
  fetchGoalAchievements,
  fetchGoalProgress,
  fetchGoals,
  updateGoal as updateGoalRequest,
  updateGoalStatus as updateGoalStatusRequest,
  upsertGoalCheckIn,
} from '../api/goalApi'
import type {
  Achievement,
  Goal,
  GoalCheckIn,
  GoalProgress,
  GoalRequest,
  GoalStatus,
  GoalStatusRequest,
  ProgressCheckInRequest,
} from '../types/Goal'

interface UseGoalsResult {
  statusFilter: GoalStatus | null
  setStatusFilter: (status: GoalStatus | null) => void
  goals: Goal[]
  progressByGoalId: Record<number, GoalProgress>
  achievements: Achievement[]
  loading: boolean
  refreshing: boolean
  mutating: boolean
  error: string | null
  reload: () => void
  createGoal: (data: GoalRequest) => Promise<Goal>
  updateGoal: (goalId: number, data: GoalRequest) => Promise<Goal>
  updateGoalStatus: (goalId: number, data: GoalStatusRequest) => Promise<Goal>
  deleteGoal: (goalId: number) => Promise<void>
  upsertCheckIn: (
    goalId: number,
    date: string,
    data: ProgressCheckInRequest,
  ) => Promise<GoalCheckIn>
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof ApiError ? error.message : fallbackMessage
}

function isValidProfileId(userProfileId: number | null): userProfileId is number {
  return userProfileId !== null && Number.isInteger(userProfileId) && userProfileId > 0
}

export function useGoals(userProfileId: number | null): UseGoalsResult {
  const [statusFilter, setStatusFilterState] = useState<GoalStatus | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [progressByGoalId, setProgressByGoalId] = useState<Record<number, GoalProgress>>({})
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)
  const mutationInProgress = useRef(false)
  const loadedContext = useRef<string | null>(null)
  const mounted = useRef(true)
  const currentProfileId = useRef(userProfileId)
  currentProfileId.current = userProfileId

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestSequence.current += 1
    }
  }, [])

  const setStatusFilter = useCallback((status: GoalStatus | null) => {
    requestSequence.current += 1
    setStatusFilterState(status)
  }, [])

  const reload = useCallback(() => {
    requestSequence.current += 1
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const currentRequest = ++requestSequence.current

    if (!isValidProfileId(userProfileId)) {
      loadedContext.current = null
      setGoals([])
      setProgressByGoalId({})
      setAchievements([])
      setLoading(false)
      setRefreshing(false)
      setError(null)
      return
    }

    const contextKey = `${userProfileId}:${statusFilter ?? 'ALL'}`
    const isBackgroundRefresh = loadedContext.current === contextKey
    if (isBackgroundRefresh) {
      setRefreshing(true)
    } else {
      setGoals([])
      setProgressByGoalId({})
      setAchievements([])
      setLoading(true)
    }
    setError(null)

    const selectedUserProfileId = userProfileId
    const selectedStatus = statusFilter
    let cancelled = false

    async function loadGoals() {
      try {
        const [goalData, achievementData] = await Promise.all([
          fetchGoals(selectedUserProfileId, selectedStatus),
          fetchGoalAchievements(selectedUserProfileId),
        ])
        const progressData = await Promise.all(
          goalData.map((goal) => fetchGoalProgress(selectedUserProfileId, goal.id)),
        )
        if (!cancelled && currentRequest === requestSequence.current) {
          setGoals(goalData)
          setProgressByGoalId(Object.fromEntries(
            progressData.map((progress) => [progress.goalId, progress]),
          ))
          setAchievements(achievementData)
          loadedContext.current = contextKey
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled && currentRequest === requestSequence.current) {
          setError(getErrorMessage(loadError, 'Failed to load goals'))
        }
      } finally {
        if (!cancelled && currentRequest === requestSequence.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadGoals()
    return () => {
      cancelled = true
    }
  }, [reloadToken, statusFilter, userProfileId])

  const beginMutation = useCallback((): number => {
    if (!isValidProfileId(userProfileId)) {
      const profileError = new Error('A valid user profile is required for goals')
      if (mounted.current) {
        setError(profileError.message)
      }
      throw profileError
    }
    if (mutationInProgress.current) {
      const mutationError = new Error('A goal update is already in progress')
      if (mounted.current) {
        setError(mutationError.message)
      }
      throw mutationError
    }
    mutationInProgress.current = true
    if (mounted.current) {
      setMutating(true)
      setError(null)
    }
    return userProfileId
  }, [userProfileId])

  const finishMutation = useCallback(() => {
    mutationInProgress.current = false
    if (mounted.current) {
      setMutating(false)
    }
  }, [])

  const handleMutationError = useCallback((
    mutationError: unknown,
    fallback: string,
    mutationUserProfileId: number,
  ) => {
    if (mounted.current && currentProfileId.current === mutationUserProfileId) {
      setError(getErrorMessage(mutationError, fallback))
    }
  }, [])

  const createGoal = useCallback(async (data: GoalRequest): Promise<Goal> => {
    const selectedUserProfileId = beginMutation()
    try {
      const created = await createGoalRequest(selectedUserProfileId, data)
      if (currentProfileId.current === selectedUserProfileId) {
        reload()
      }
      return created
    } catch (mutationError) {
      handleMutationError(mutationError, 'Failed to create goal', selectedUserProfileId)
      throw mutationError
    } finally {
      finishMutation()
    }
  }, [beginMutation, finishMutation, handleMutationError, reload])

  const updateGoal = useCallback(async (goalId: number, data: GoalRequest): Promise<Goal> => {
    const selectedUserProfileId = beginMutation()
    try {
      const updated = await updateGoalRequest(selectedUserProfileId, goalId, data)
      if (currentProfileId.current === selectedUserProfileId) {
        reload()
      }
      return updated
    } catch (mutationError) {
      handleMutationError(mutationError, 'Failed to update goal', selectedUserProfileId)
      throw mutationError
    } finally {
      finishMutation()
    }
  }, [beginMutation, finishMutation, handleMutationError, reload])

  const updateGoalStatus = useCallback(
    async (goalId: number, data: GoalStatusRequest): Promise<Goal> => {
      const selectedUserProfileId = beginMutation()
      try {
        const updated = await updateGoalStatusRequest(selectedUserProfileId, goalId, data)
        if (currentProfileId.current === selectedUserProfileId) {
          reload()
        }
        return updated
      } catch (mutationError) {
        handleMutationError(
          mutationError,
          'Failed to update goal status',
          selectedUserProfileId,
        )
        throw mutationError
      } finally {
        finishMutation()
      }
    },
    [beginMutation, finishMutation, handleMutationError, reload],
  )

  const deleteGoal = useCallback(async (goalId: number): Promise<void> => {
    const selectedUserProfileId = beginMutation()
    try {
      await deleteGoalRequest(selectedUserProfileId, goalId)
      if (currentProfileId.current === selectedUserProfileId) {
        reload()
      }
    } catch (mutationError) {
      handleMutationError(mutationError, 'Failed to delete goal', selectedUserProfileId)
      throw mutationError
    } finally {
      finishMutation()
    }
  }, [beginMutation, finishMutation, handleMutationError, reload])

  const upsertCheckIn = useCallback(
    async (
      goalId: number,
      date: string,
      data: ProgressCheckInRequest,
    ): Promise<GoalCheckIn> => {
      const selectedUserProfileId = beginMutation()
      try {
        const checkIn = await upsertGoalCheckIn(selectedUserProfileId, goalId, date, data)
        if (currentProfileId.current === selectedUserProfileId) {
          reload()
        }
        return checkIn
      } catch (mutationError) {
        handleMutationError(
          mutationError,
          'Failed to update goal check-in',
          selectedUserProfileId,
        )
        throw mutationError
      } finally {
        finishMutation()
      }
    },
    [beginMutation, finishMutation, handleMutationError, reload],
  )

  return {
    statusFilter,
    setStatusFilter,
    goals,
    progressByGoalId,
    achievements,
    loading,
    refreshing,
    mutating,
    error,
    reload,
    createGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
    upsertCheckIn,
  }
}
