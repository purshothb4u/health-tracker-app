import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import { fetchDailyTargets } from '../api/dailyTargetsApi'
import type { DailyTargets } from '../types/DailyTargets'

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

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Estimated daily targets could not be loaded.'
}

export function useDailyTargets(profileContextId: number | null): UseDailyTargetsResult {
  const [state, setState] = useState<DailyTargetsState>({
    profileContextId,
    data: null,
    loading: profileContextId !== null,
    error: null,
  })
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)

  const reload = useCallback(() => {
    requestSequence.current += 1
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const currentRequest = ++requestSequence.current

    if (profileContextId === null) {
      setState({ profileContextId: null, data: null, loading: false, error: null })
      return
    }

    const requestedProfileContextId = profileContextId
    let cancelled = false
    setState((current) => current.profileContextId === requestedProfileContextId
      ? { ...current, loading: true, error: null }
      : {
        profileContextId: requestedProfileContextId,
        data: null,
        loading: true,
        error: null,
      })

    async function loadTargets() {
      try {
        const response = await fetchDailyTargets()
        if (!cancelled && currentRequest === requestSequence.current) {
          setState({
            profileContextId: requestedProfileContextId,
            data: response,
            loading: false,
            error: null,
          })
        }
      } catch (requestError) {
        if (!cancelled && currentRequest === requestSequence.current) {
          setState((current) => ({
            ...current,
            loading: false,
            error: errorMessage(requestError),
          }))
        }
      }
    }

    void loadTargets()
    return () => {
      cancelled = true
    }
  }, [profileContextId, reloadToken])

  if (state.profileContextId !== profileContextId) {
    return {
      data: null,
      loading: profileContextId !== null,
      error: null,
      reload,
    }
  }

  return { data: state.data, loading: state.loading, error: state.error, reload }
}
