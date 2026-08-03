import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router'
import { useUserProfiles } from '../hooks/useUserProfiles'
import type { UserProfile } from '../types/UserProfile'

interface SelectedProfileContextValue {
  profiles: UserProfile[]
  selectedProfile: UserProfile | null
  selectedProfileId: number | null
  participantUserProfileIds: readonly number[]
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

  const defaultProfile = useMemo(
    () => profiles.find((profile) => profile.name === 'Husband') ?? profiles[0] ?? null,
    [profiles],
  )

  const requestedProfile = useMemo(
    () => profiles.find((profile) => profile.id === requestedProfileId) ?? null,
    [profiles, requestedProfileId],
  )

  const selectedProfile = requestedProfile ?? defaultProfile
  const selectedProfileId = selectedProfile?.id ?? null

  const participantUserProfileIds = useMemo(
    () => profiles.slice(0, 2).map((profile) => profile.id),
    [profiles],
  )

  useEffect(() => {
    if (loading || error !== null || selectedProfileId === null) {
      return
    }

    if (requestedProfileId === selectedProfileId) {
      return
    }

    const correctedParams = new URLSearchParams(searchParams)
    correctedParams.set('profile', String(selectedProfileId))
    setSearchParams(correctedParams, { replace: true })
  }, [error, loading, requestedProfileId, searchParams, selectedProfileId, setSearchParams])

  const selectProfile = useCallback((profileId: number) => {
    if (loading || !profiles.some((profile) => profile.id === profileId)) {
      return
    }

    if (profileId === selectedProfileId) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('profile', String(profileId))
    setSearchParams(nextParams)
  }, [loading, profiles, searchParams, selectedProfileId, setSearchParams])

  const value = useMemo<SelectedProfileContextValue>(() => ({
    profiles,
    selectedProfile,
    selectedProfileId,
    participantUserProfileIds,
    loading,
    error,
    reloadProfiles: reload,
    selectProfile,
  }), [
    error,
    loading,
    participantUserProfileIds,
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
