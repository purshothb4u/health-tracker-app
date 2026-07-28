import { useCallback, useEffect, useState } from 'react'
import { fetchUserProfiles } from '../api/userProfileApi'
import { ApiError } from '../api/client'
import type { UserProfile } from '../types/UserProfile'

interface UseUserProfilesResult {
  profiles: UserProfile[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useUserProfiles(): UseUserProfilesResult {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProfiles() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchUserProfiles()
        if (!cancelled) {
          setProfiles(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Failed to load user profiles'
          setError(message)
          setProfiles([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfiles()

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return { profiles, loading, error, reload }
}
