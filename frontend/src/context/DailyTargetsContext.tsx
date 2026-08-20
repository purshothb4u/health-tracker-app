import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '../api/client'
import { fetchDailyTargets } from '../api/dailyTargetsApi'
import type { DailyTargets } from '../types/DailyTargets'
import { useSelectedProfile } from './SelectedProfileContext'

export interface UseDailyTargetsResult {
  data: DailyTargets | null
  loading: boolean
  error: string | null
  reload: () => void
}

interface DailyTargetsState {
  profileContextId: number | null
  data: DailyTargets | null
  loading: boolean
  error: string | null
}

interface DailyTargetsContextValue extends DailyTargetsState {
  ensureLoaded: (profileContextId: number) => void
  reload: () => void
}

const DailyTargetsContext = createContext<DailyTargetsContextValue | null>(null)

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Estimated daily targets could not be loaded.'
}

export function DailyTargetsProvider({ children }: { children: ReactNode }) {
  const { selectedProfileId } = useSelectedProfile()
  const [state, setState] = useState<DailyTargetsState>({
    profileContextId: selectedProfileId,
    data: null,
    loading: false,
    error: null,
  })
  const stateRef = useRef(state)
  const requestSequence = useRef(0)
  const activeRequestProfileId = useRef<number | null>(null)
  stateRef.current = state

  useEffect(() => () => {
    requestSequence.current += 1
    activeRequestProfileId.current = null
  }, [])

  const load = useCallback(async (profileContextId: number, force: boolean) => {
    const current = stateRef.current
    if (!force && (
      activeRequestProfileId.current === profileContextId
      || (current.profileContextId === profileContextId && current.data !== null)
    )) {
      return
    }

    const currentRequest = ++requestSequence.current
    activeRequestProfileId.current = profileContextId
    setState((existing) => existing.profileContextId === profileContextId
      ? { ...existing, loading: true, error: null }
      : { profileContextId, data: null, loading: true, error: null })

    try {
      const response = await fetchDailyTargets()
      if (currentRequest === requestSequence.current) {
        activeRequestProfileId.current = null
        setState({
          profileContextId,
          data: response,
          loading: false,
          error: null,
        })
      }
    } catch (requestError) {
      if (currentRequest === requestSequence.current) {
        activeRequestProfileId.current = null
        setState((existing) => ({
          ...existing,
          loading: false,
          error: errorMessage(requestError),
        }))
      }
    }
  }, [])

  const ensureLoaded = useCallback((profileContextId: number) => {
    void load(profileContextId, false)
  }, [load])

  const reload = useCallback(() => {
    if (selectedProfileId !== null) {
      void load(selectedProfileId, true)
    }
  }, [load, selectedProfileId])

  const value = useMemo<DailyTargetsContextValue>(() => ({
    ...state,
    ensureLoaded,
    reload,
  }), [ensureLoaded, reload, state])

  return (
    <DailyTargetsContext.Provider value={value}>
      {children}
    </DailyTargetsContext.Provider>
  )
}

function useDailyTargetsContext(): DailyTargetsContextValue {
  const context = useContext(DailyTargetsContext)
  if (context === null) {
    throw new Error('Daily targets must be used within DailyTargetsProvider')
  }
  return context
}

export function useSharedDailyTargets(profileContextId: number | null): UseDailyTargetsResult {
  const context = useDailyTargetsContext()

  useEffect(() => {
    if (profileContextId !== null) {
      context.ensureLoaded(profileContextId)
    }
  }, [context.ensureLoaded, profileContextId])

  if (context.profileContextId !== profileContextId) {
    return {
      data: null,
      loading: profileContextId !== null,
      error: null,
      reload: context.reload,
    }
  }

  return {
    data: context.data,
    loading: context.loading,
    error: context.error,
    reload: context.reload,
  }
}

export function useDailyTargetsInvalidation(): () => void {
  return useDailyTargetsContext().reload
}
