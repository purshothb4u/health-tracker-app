import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDailyActivitySummary } from '../api/activityTrackingApi'
import { ApiError } from '../api/client'
import {
  fetchCoupleAchievements,
  fetchCoupleChallengeProgress,
  fetchCoupleChallenges,
} from '../api/coupleChallengeApi'
import { fetchDailyNutritionSummary, fetchFoodEntries } from '../api/foodEntryApi'
import { fetchGoalAchievements, fetchGoalProgress, fetchGoals } from '../api/goalApi'
import { fetchHealthSummary } from '../api/healthMetricApi'
import { fetchDailySleepSummary } from '../api/sleepTrackingApi'
import { fetchHydrationSummary } from '../api/waterTrackingApi'
import type { DailyActivitySummary } from '../types/ActivityTracking'
import type { CoupleChallenge, CoupleChallengeProgress } from '../types/CoupleChallenge'
import type { DailyNutritionSummary } from '../types/FoodEntry'
import type { Achievement, Goal, GoalProgress } from '../types/Goal'
import type { HealthSummary } from '../types/HealthMetric'
import type { DailySleepSummary } from '../types/SleepTracking'
import type { HydrationSummary } from '../types/WaterTracking'

export interface OverviewSectionState<T> {
  data: T | null
  loading: boolean
  available: boolean
  error: string | null
}

export interface OverviewNutritionData {
  summary: DailyNutritionSummary
  foodEntryCount: number
}

export interface OverviewGoalPreviewItem {
  goal: Goal
  progress: GoalProgress | null
  progressError: string | null
}

export interface OverviewChallengePreviewItem {
  challenge: CoupleChallenge
  progress: CoupleChallengeProgress | null
  progressError: string | null
}

interface OverviewAchievementsData {
  items: Achievement[]
  partialError: string | null
}

interface OverviewState {
  profileId: number | null
  today: string
  health: OverviewSectionState<HealthSummary>
  nutrition: OverviewSectionState<OverviewNutritionData>
  hydration: OverviewSectionState<HydrationSummary>
  activity: OverviewSectionState<DailyActivitySummary>
  sleep: OverviewSectionState<DailySleepSummary>
  goals: OverviewSectionState<OverviewGoalPreviewItem[]>
  challenge: OverviewSectionState<OverviewChallengePreviewItem[]>
  achievements: OverviewSectionState<Achievement[]>
  lastRefreshedAt: string | null
}

export interface UseOverviewDataResult extends Omit<OverviewState, 'profileId'> {
  initialLoading: boolean
  refreshing: boolean
  reload: () => void
}

function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptySection<T>(loading: boolean): OverviewSectionState<T> {
  return { data: null, loading, available: false, error: null }
}

function createState(profileId: number | null, loading: boolean): OverviewState {
  return {
    profileId,
    today: getTodayLocalDate(),
    health: emptySection<HealthSummary>(loading),
    nutrition: emptySection<OverviewNutritionData>(loading),
    hydration: emptySection<HydrationSummary>(loading),
    activity: emptySection<DailyActivitySummary>(loading),
    sleep: emptySection<DailySleepSummary>(loading),
    goals: emptySection<OverviewGoalPreviewItem[]>(loading),
    challenge: emptySection<OverviewChallengePreviewItem[]>(loading),
    achievements: emptySection<Achievement[]>(loading),
    lastRefreshedAt: null,
  }
}

function beginLoading<T>(section: OverviewSectionState<T>): OverviewSectionState<T> {
  return { ...section, loading: true, error: null }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function completedSection<T>(
  result: PromiseSettledResult<T>,
  current: OverviewSectionState<T>,
  fallbackError: string,
): OverviewSectionState<T> {
  if (result.status === 'fulfilled') {
    return { data: result.value, loading: false, available: true, error: null }
  }
  return {
    data: current.data,
    loading: false,
    available: current.available,
    error: errorMessage(result.reason, fallbackError),
  }
}

async function loadNutrition(userProfileId: number, today: string): Promise<OverviewNutritionData> {
  const [summary, entries] = await Promise.all([
    fetchDailyNutritionSummary(userProfileId, today),
    fetchFoodEntries(userProfileId, today),
  ])
  return { summary, foodEntryCount: entries.length }
}

async function loadGoalPreviews(userProfileId: number): Promise<OverviewGoalPreviewItem[]> {
  const goals = (await fetchGoals(userProfileId, 'ACTIVE')).slice(0, 2)
  const progressResults = await Promise.allSettled(
    goals.map((goal) => fetchGoalProgress(userProfileId, goal.id)),
  )
  return goals.map((goal, index) => {
    const progressResult = progressResults[index]
    return {
      goal,
      progress: progressResult.status === 'fulfilled' ? progressResult.value : null,
      progressError: progressResult.status === 'rejected'
        ? errorMessage(progressResult.reason, 'Goal progress is unavailable.')
        : null,
    }
  })
}

async function loadChallengePreview(userProfileId: number): Promise<OverviewChallengePreviewItem[]> {
  const challenge = (await fetchCoupleChallenges('ACTIVE'))
    .find((candidate) => candidate.participants.some(
      (participant) => participant.userProfileId === userProfileId,
    ))
  if (!challenge) {
    return []
  }

  const progressResult = await Promise.allSettled([
    fetchCoupleChallengeProgress(challenge.id),
  ])
  const progress = progressResult[0]
  return [{
    challenge,
    progress: progress.status === 'fulfilled' ? progress.value : null,
    progressError: progress.status === 'rejected'
      ? errorMessage(progress.reason, 'Shared challenge progress is unavailable.')
      : null,
  }]
}

async function loadAchievements(userProfileId: number): Promise<OverviewAchievementsData> {
  const [goalResult, coupleResult] = await Promise.allSettled([
    fetchGoalAchievements(userProfileId),
    fetchCoupleAchievements(userProfileId),
  ])

  if (goalResult.status === 'rejected' && coupleResult.status === 'rejected') {
    throw goalResult.reason
  }

  const achievements = [
    ...(goalResult.status === 'fulfilled' ? goalResult.value : []),
    ...(coupleResult.status === 'fulfilled' ? coupleResult.value : []),
  ].filter((achievement, index, all) => all.findIndex((candidate) => (
    candidate.achievementType === achievement.achievementType
    && candidate.goalId === achievement.goalId
    && candidate.challengeId === achievement.challengeId
  )) === index).slice(0, 3)

  return {
    items: achievements,
    partialError: goalResult.status === 'rejected' || coupleResult.status === 'rejected'
      ? 'Some achievements could not be loaded.'
      : null,
  }
}

export function useOverviewData(userProfileId: number | null): UseOverviewDataResult {
  const [state, setState] = useState<OverviewState>(() => createState(userProfileId, userProfileId !== null))
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestSequence.current += 1
    }
  }, [])

  const reload = useCallback(() => {
    requestSequence.current += 1
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const currentRequest = ++requestSequence.current

    if (userProfileId === null) {
      setState(createState(null, false))
      return
    }

    const selectedProfileId = userProfileId
    const today = getTodayLocalDate()
    setState((current) => {
      const base = current.profileId === selectedProfileId
        ? { ...current, today }
        : createState(selectedProfileId, false)
      return {
        ...base,
        health: beginLoading(base.health),
        nutrition: beginLoading(base.nutrition),
        hydration: beginLoading(base.hydration),
        activity: beginLoading(base.activity),
        sleep: beginLoading(base.sleep),
        goals: beginLoading(base.goals),
        challenge: beginLoading(base.challenge),
        achievements: beginLoading(base.achievements),
      }
    })

    let cancelled = false

    async function loadOverview() {
      const results = await Promise.allSettled([
        fetchHealthSummary(selectedProfileId),
        loadNutrition(selectedProfileId, today),
        fetchHydrationSummary(selectedProfileId, today),
        fetchDailyActivitySummary(selectedProfileId, today),
        fetchDailySleepSummary(selectedProfileId, today),
        loadGoalPreviews(selectedProfileId),
        loadChallengePreview(selectedProfileId),
        loadAchievements(selectedProfileId),
      ] as const)

      if (cancelled || !mounted.current || currentRequest !== requestSequence.current) {
        return
      }

      setState((current) => {
        const base = current.profileId === selectedProfileId
          ? current
          : createState(selectedProfileId, false)
        const achievementResult = results[7]
        const achievements = achievementResult.status === 'fulfilled'
          ? {
            data: achievementResult.value.items,
            loading: false,
            available: true,
            error: achievementResult.value.partialError,
          }
          : {
            data: base.achievements.data,
            loading: false,
            available: base.achievements.available,
            error: errorMessage(achievementResult.reason, 'Achievements are unavailable.'),
          }
        const anySuccessful = results.some((result) => result.status === 'fulfilled')

        return {
          profileId: selectedProfileId,
          today,
          health: completedSection(results[0], base.health, 'Health summary is unavailable.'),
          nutrition: completedSection(results[1], base.nutrition, 'Nutrition summary is unavailable.'),
          hydration: completedSection(results[2], base.hydration, 'Hydration summary is unavailable.'),
          activity: completedSection(results[3], base.activity, 'Activity summary is unavailable.'),
          sleep: completedSection(results[4], base.sleep, 'Sleep summary is unavailable.'),
          goals: completedSection(results[5], base.goals, 'Active goals are unavailable.'),
          challenge: completedSection(results[6], base.challenge, 'Shared challenge is unavailable.'),
          achievements,
          lastRefreshedAt: anySuccessful ? new Date().toISOString() : base.lastRefreshedAt,
        }
      })
    }

    void loadOverview()
    return () => {
      cancelled = true
    }
  }, [reloadToken, userProfileId])

  const visibleState = state.profileId === userProfileId
    ? state
    : createState(userProfileId, userProfileId !== null)
  const sections = [
    visibleState.health,
    visibleState.nutrition,
    visibleState.hydration,
    visibleState.activity,
    visibleState.sleep,
    visibleState.goals,
    visibleState.challenge,
    visibleState.achievements,
  ]
  const hasVisibleData = sections.some((section) => section.data !== null)
  const anyLoading = sections.some((section) => section.loading)

  return {
    today: visibleState.today,
    health: visibleState.health,
    nutrition: visibleState.nutrition,
    hydration: visibleState.hydration,
    activity: visibleState.activity,
    sleep: visibleState.sleep,
    goals: visibleState.goals,
    challenge: visibleState.challenge,
    achievements: visibleState.achievements,
    lastRefreshedAt: visibleState.lastRefreshedAt,
    initialLoading: anyLoading && !hasVisibleData,
    refreshing: anyLoading && hasVisibleData,
    reload,
  }
}
