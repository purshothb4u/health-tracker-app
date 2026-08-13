import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from './AuthContext'
import { useUserProfiles } from '../hooks/useUserProfiles'
import type { UserProfile } from '../types/UserProfile'

interface SelectedProfileContextValue {
  profiles: UserProfile[]
  selectedProfile: UserProfile | null
  selectedProfileId: number | null
  loading: boolean
  error: string | null
  reloadProfiles: () => void
  selectProfile: (profileId: number) => void
}

interface SelectedProfileProviderProps {
  children: ReactNode
}

const SelectedProfileContext = createContext<SelectedProfileContextValue | null>(null)

function profileOrder(profile: UserProfile): number {
  if (profile.name === 'Husband') return 0
  if (profile.name === 'Wife') return 1
  return 2
}

function parseProfileId(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) {
    return null
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export function SelectedProfileProvider({ children }: SelectedProfileProviderProps) {
  const { identity } = useAuth()
  const { profiles: loadedProfiles, loading, error, reload } = useUserProfiles()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedProfileId = parseProfileId(searchParams.get('profile'))

  const profiles = useMemo(
    () => [...loadedProfiles].sort((left, right) => {
      const orderDifference = profileOrder(left) - profileOrder(right)
      return orderDifference !== 0 ? orderDifference : left.id - right.id
    }),
    [loadedProfiles],
  )

  const selectedProfileId = identity?.profileId ?? null
  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  )
  const identityError = !loading && error === null && selectedProfileId !== null
    && selectedProfile === null
    ? 'The authenticated profile is not available.'
    : null
  const resolvedError = error ?? identityError

  useEffect(() => {
    if (selectedProfileId === null) {
      return
    }

    if (requestedProfileId === selectedProfileId) {
      return
    }

    const correctedParams = new URLSearchParams(searchParams)
    correctedParams.set('profile', String(selectedProfileId))
    setSearchParams(correctedParams, { replace: true })
  }, [requestedProfileId, searchParams, selectedProfileId, setSearchParams])

  const selectProfile = useCallback((profileId: number) => {
    if (profileId !== selectedProfileId || requestedProfileId === selectedProfileId) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('profile', String(profileId))
    setSearchParams(nextParams)
  }, [requestedProfileId, searchParams, selectedProfileId, setSearchParams])

  const value = useMemo<SelectedProfileContextValue>(() => ({
    profiles,
    selectedProfile,
    selectedProfileId,
    loading,
    error: resolvedError,
    reloadProfiles: reload,
    selectProfile,
  }), [
    resolvedError,
    loading,
    profiles,
    reload,
    selectProfile,
    selectedProfile,
    selectedProfileId,
  ])

  return (
    <SelectedProfileContext.Provider value={value}>
      {children}
    </SelectedProfileContext.Provider>
  )
}

export function useSelectedProfile(): SelectedProfileContextValue {
  const context = useContext(SelectedProfileContext)
  if (context === null) {
    throw new Error('useSelectedProfile must be used within SelectedProfileProvider')
  }
  return context
}
