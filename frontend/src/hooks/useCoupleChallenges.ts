import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import {
  createCoupleChallenge,
  deleteCoupleChallenge,
  fetchCoupleAchievements,
  fetchCoupleChallengeProgress,
  fetchCoupleChallenges,
  updateCoupleChallenge,
  updateCoupleChallengeStatus,
  upsertChallengeCheckIn,
} from '../api/coupleChallengeApi'
import type {
  Achievement,
  ChallengeCheckIn,
  ChallengeStatus,
  ChallengeStatusRequest,
  CoupleChallenge,
  CoupleChallengeProgress,
  CoupleChallengeRequest,
  ProgressCheckInRequest,
} from '../types/CoupleChallenge'

interface UseCoupleChallengesResult {
  statusFilter: ChallengeStatus | null
  setStatusFilter: (status: ChallengeStatus | null) => void
  challenges: CoupleChallenge[]
  progressByChallengeId: Record<number, CoupleChallengeProgress>
  achievementsByUserProfileId: Record<number, Achievement[]>
  loading: boolean
  refreshing: boolean
  mutating: boolean
  error: string | null
  reload: () => void
  createChallenge: (data: CoupleChallengeRequest) => Promise<CoupleChallenge>
  updateChallenge: (
    challengeId: number,
    data: CoupleChallengeRequest,
  ) => Promise<CoupleChallenge>
  updateChallengeStatus: (
    challengeId: number,
    data: ChallengeStatusRequest,
  ) => Promise<CoupleChallenge>
  deleteChallenge: (challengeId: number) => Promise<void>
  upsertParticipantCheckIn: (
    challengeId: number,
    participantUserProfileId: number,
    date: string,
    data: ProgressCheckInRequest,
  ) => Promise<ChallengeCheckIn>
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof ApiError ? error.message : fallbackMessage
}

function validParticipantIds(ids: readonly number[]): ids is readonly [number, number] {
  return ids.length === 2
    && Number.isInteger(ids[0])
    && ids[0] > 0
    && Number.isInteger(ids[1])
    && ids[1] > 0
    && ids[0] !== ids[1]
}

function participantKey(ids: readonly number[]): string {
  return ids.join(':')
}

export function useCoupleChallenges(
  participantUserProfileIds: readonly number[],
): UseCoupleChallengesResult {
  const [statusFilter, setStatusFilterState] = useState<ChallengeStatus | null>(null)
  const [challenges, setChallenges] = useState<CoupleChallenge[]>([])
  const [progressByChallengeId, setProgressByChallengeId] =
    useState<Record<number, CoupleChallengeProgress>>({})
  const [achievementsByUserProfileId, setAchievementsByUserProfileId] =
    useState<Record<number, Achievement[]>>({})
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)
  const mutationInProgress = useRef(false)
  const loadedContext = useRef<string | null>(null)
  const mounted = useRef(true)
  const suppliedParticipantKey = participantKey(participantUserProfileIds)
  const currentParticipantKey = useRef(suppliedParticipantKey)
  currentParticipantKey.current = suppliedParticipantKey

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestSequence.current += 1
    }
  }, [])

  const setStatusFilter = useCallback((status: ChallengeStatus | null) => {
    requestSequence.current += 1
    setStatusFilterState(status)
  }, [])

  const reload = useCallback(() => {
    requestSequence.current += 1
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const currentRequest = ++requestSequence.current

    if (!validParticipantIds(participantUserProfileIds)) {
      loadedContext.current = null
      setChallenges([])
      setProgressByChallengeId({})
      setAchievementsByUserProfileId({})
      setLoading(false)
      setRefreshing(false)
      setError(null)
      return
    }

    const selectedParticipantIds = [...participantUserProfileIds] as [number, number]
    const selectedParticipantKey = participantKey(selectedParticipantIds)
    const contextKey = `${selectedParticipantKey}:${statusFilter ?? 'ALL'}`
    const isBackgroundRefresh = loadedContext.current === contextKey
    if (isBackgroundRefresh) {
      setRefreshing(true)
    } else {
      setChallenges([])
      setProgressByChallengeId({})
      setAchievementsByUserProfileId({})
      setLoading(true)
    }
    setError(null)

    const selectedStatus = statusFilter
    let cancelled = false

    async function loadChallenges() {
      try {
        const [challengeData, achievementPairs] = await Promise.all([
          fetchCoupleChallenges(selectedStatus),
          Promise.all(selectedParticipantIds.map(async (userProfileId) => [
            userProfileId,
            await fetchCoupleAchievements(userProfileId),
          ] as const)),
        ])
        const progressData = await Promise.all(
          challengeData.map((challenge) => fetchCoupleChallengeProgress(challenge.id)),
        )
        if (!cancelled && currentRequest === requestSequence.current) {
          setChallenges(challengeData)
          setProgressByChallengeId(Object.fromEntries(
            progressData.map((progress) => [progress.challengeId, progress]),
          ))
          setAchievementsByUserProfileId(Object.fromEntries(achievementPairs))
          loadedContext.current = contextKey
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled && currentRequest === requestSequence.current) {
          setError(getErrorMessage(loadError, 'Failed to load couple challenges'))
        }
      } finally {
        if (!cancelled && currentRequest === requestSequence.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadChallenges()
    return () => {
      cancelled = true
    }
  }, [reloadToken, statusFilter, suppliedParticipantKey])

  const beginMutation = useCallback((): string => {
    if (!validParticipantIds(participantUserProfileIds)) {
      const participantError = new Error(
        'Two valid distinct participant profiles are required for couple challenges',
      )
      if (mounted.current) {
        setError(participantError.message)
      }
      throw participantError
    }
    if (mutationInProgress.current) {
      const mutationError = new Error('A couple challenge update is already in progress')
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
    return participantKey(participantUserProfileIds)
  }, [participantUserProfileIds, suppliedParticipantKey])

  const finishMutation = useCallback(() => {
    mutationInProgress.current = false
    if (mounted.current) {
      setMutating(false)
    }
  }, [])

  const handleMutationError = useCallback(
    (mutationError: unknown, fallback: string, mutationParticipantKey: string) => {
      if (mounted.current && currentParticipantKey.current === mutationParticipantKey) {
        setError(getErrorMessage(mutationError, fallback))
      }
    },
    [],
  )

  const createChallenge = useCallback(
    async (data: CoupleChallengeRequest): Promise<CoupleChallenge> => {
      const mutationParticipantKey = beginMutation()
      try {
        const created = await createCoupleChallenge(data)
        if (currentParticipantKey.current === mutationParticipantKey) {
          reload()
        }
        return created
      } catch (mutationError) {
        handleMutationError(mutationError, 'Failed to create couple challenge', mutationParticipantKey)
        throw mutationError
      } finally {
        finishMutation()
      }
    },
    [beginMutation, finishMutation, handleMutationError, reload],
  )

  const updateChallenge = useCallback(
    async (challengeId: number, data: CoupleChallengeRequest): Promise<CoupleChallenge> => {
      const mutationParticipantKey = beginMutation()
      try {
        const updated = await updateCoupleChallenge(challengeId, data)
        if (currentParticipantKey.current === mutationParticipantKey) {
          reload()
        }
        return updated
      } catch (mutationError) {
        handleMutationError(mutationError, 'Failed to update couple challenge', mutationParticipantKey)
        throw mutationError
      } finally {
        finishMutation()
      }
    },
    [beginMutation, finishMutation, handleMutationError, reload],
  )

  const updateChallengeStatus = useCallback(
    async (challengeId: number, data: ChallengeStatusRequest): Promise<CoupleChallenge> => {
      const mutationParticipantKey = beginMutation()
      try {
        const updated = await updateCoupleChallengeStatus(challengeId, data)
        if (currentParticipantKey.current === mutationParticipantKey) {
          reload()
        }
        return updated
      } catch (mutationError) {
        handleMutationError(
          mutationError,
          'Failed to update couple challenge status',
          mutationParticipantKey,
        )
        throw mutationError
      } finally {
        finishMutation()
      }
    },
    [beginMutation, finishMutation, handleMutationError, reload],
  )

  const deleteChallenge = useCallback(async (challengeId: number): Promise<void> => {
    const mutationParticipantKey = beginMutation()
    try {
      await deleteCoupleChallenge(challengeId)
      if (currentParticipantKey.current === mutationParticipantKey) {
        reload()
      }
    } catch (mutationError) {
      handleMutationError(mutationError, 'Failed to delete couple challenge', mutationParticipantKey)
      throw mutationError
    } finally {
      finishMutation()
    }
  }, [beginMutation, finishMutation, handleMutationError, reload])

  const upsertParticipantCheckIn = useCallback(
    async (
      challengeId: number,
      participantUserProfileId: number,
      date: string,
      data: ProgressCheckInRequest,
    ): Promise<ChallengeCheckIn> => {
      const mutationParticipantKey = beginMutation()
      try {
        const checkIn = await upsertChallengeCheckIn(
          challengeId,
          participantUserProfileId,
          date,
          data,
        )
        if (currentParticipantKey.current === mutationParticipantKey) {
          reload()
        }
        return checkIn
      } catch (mutationError) {
        handleMutationError(
          mutationError,
          'Failed to update challenge check-in',
          mutationParticipantKey,
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
    challenges,
    progressByChallengeId,
    achievementsByUserProfileId,
    loading,
    refreshing,
    mutating,
    error,
    reload,
    createChallenge,
    updateChallenge,
    updateChallengeStatus,
    deleteChallenge,
    upsertParticipantCheckIn,
  }
}
