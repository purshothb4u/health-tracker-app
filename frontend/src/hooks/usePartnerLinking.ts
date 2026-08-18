import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  acceptPartnerInvitation,
  createPartnerInvitation,
  fetchActivePartnerInvitation,
  previewPartnerInvitation,
  revokeActivePartnerInvitation,
} from '../api/partnerInvitationApi'
import { ApiError } from '../api/client'
import { fetchEligibleCoupleParticipants } from '../api/coupleChallengeApi'
import { useAuth } from '../context/AuthContext'
import type { EligibleCoupleParticipant } from '../types/CoupleChallenge'
import type {
  PartnerInvitationCreated,
  PartnerInvitationPreview,
  PartnerInvitationStatus,
  PartnerLink,
} from '../types/PartnerInvitation'

export interface PartnerLinkingError {
  title: string
  message: string
  retryable: boolean
}

export interface UsePartnerLinkingResult {
  activeInvitation: PartnerInvitationStatus | null
  rawInvitation: PartnerInvitationCreated | null
  preview: PartnerInvitationPreview | null
  eligibleParticipants: EligibleCoupleParticipant[]
  partner: EligibleCoupleParticipant | null
  linked: boolean
  loading: boolean
  refreshing: boolean
  mutating: boolean
  loadError: PartnerLinkingError | null
  actionError: PartnerLinkingError | null
  successMessage: string | null
  reload: () => void
  clearActionFeedback: () => void
  clearPreview: () => void
  createInvitation: () => Promise<PartnerInvitationCreated>
  revokeInvitation: () => Promise<void>
  previewInvitation: (inviteCode: string) => Promise<PartnerInvitationPreview>
  acceptInvitation: (inviteCode: string) => Promise<PartnerLink>
}

function classifyError(error: unknown, fallback: string): PartnerLinkingError {
  if (error instanceof ApiError && error.status === 400) {
    return {
      title: 'Invitation unavailable',
      message: error.message,
      retryable: false,
    }
  }
  if (error instanceof ApiError && error.status === 409) {
    return {
      title: 'Partner linking unavailable',
      message: error.message,
      retryable: false,
    }
  }
  if (error instanceof ApiError && error.status !== undefined && error.status < 500) {
    return {
      title: 'Unable to complete the request',
      message: error.message,
      retryable: false,
    }
  }
  return {
    title: 'Connection problem',
    message: fallback,
    retryable: true,
  }
}

export function usePartnerLinking(): UsePartnerLinkingResult {
  const { identity, refreshIdentity } = useAuth()
  const [activeInvitation, setActiveInvitation] = useState<PartnerInvitationStatus | null>(null)
  const [rawInvitation, setRawInvitation] = useState<PartnerInvitationCreated | null>(null)
  const [preview, setPreview] = useState<PartnerInvitationPreview | null>(null)
  const [eligibleParticipants, setEligibleParticipants] = useState<EligibleCoupleParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [loadError, setLoadError] = useState<PartnerLinkingError | null>(null)
  const [actionError, setActionError] = useState<PartnerLinkingError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestSequence = useRef(0)
  const mutationInProgress = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestSequence.current += 1
    }
  }, [])

  const loadPartnerState = useCallback(async (background: boolean) => {
    const currentRequest = ++requestSequence.current
    if (mounted.current) {
      if (background) setRefreshing(true)
      else setLoading(true)
      setLoadError(null)
    }

    try {
      const [invitationStatus, participants] = await Promise.all([
        fetchActivePartnerInvitation(),
        fetchEligibleCoupleParticipants(),
      ])
      if (mounted.current && currentRequest === requestSequence.current) {
        setActiveInvitation(invitationStatus)
        setEligibleParticipants(participants)
        setLoadError(null)
      }
      return participants
    } catch (error) {
      if (mounted.current && currentRequest === requestSequence.current) {
        setLoadError(classifyError(error, 'Unable to load partner information. Try again.'))
      }
      throw error
    } finally {
      if (mounted.current && currentRequest === requestSequence.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadPartnerState(false).catch(() => undefined)
  }, [loadPartnerState, reloadToken])

  const reload = useCallback(() => {
    requestSequence.current += 1
    setReloadToken((current) => current + 1)
  }, [])

  const beginMutation = useCallback(() => {
    if (mutationInProgress.current) {
      throw new Error('A partner invitation update is already in progress.')
    }
    mutationInProgress.current = true
    if (mounted.current) {
      setMutating(true)
      setActionError(null)
      setSuccessMessage(null)
    }
  }, [])

  const finishMutation = useCallback(() => {
    mutationInProgress.current = false
    if (mounted.current) setMutating(false)
  }, [])

  const clearActionFeedback = useCallback(() => {
    setActionError(null)
    setSuccessMessage(null)
  }, [])

  const clearPreview = useCallback(() => {
    setPreview(null)
    setActionError(null)
  }, [])

  const createInvitation = useCallback(async () => {
    beginMutation()
    try {
      const created = await createPartnerInvitation()
      if (mounted.current) {
        setRawInvitation(created)
        setPreview(null)
        setActiveInvitation({ active: true, expiresAt: created.expiresAt })
        setSuccessMessage('A new partner invitation is ready to share.')
      }
      return created
    } catch (error) {
      if (mounted.current) {
        setActionError(classifyError(error, 'Unable to create an invitation. Try again.'))
      }
      throw error
    } finally {
      finishMutation()
    }
  }, [beginMutation, finishMutation])

  const revokeInvitation = useCallback(async () => {
    beginMutation()
    try {
      await revokeActivePartnerInvitation()
      if (mounted.current) {
        setRawInvitation(null)
        setPreview(null)
        setActiveInvitation({ active: false, expiresAt: null })
        setSuccessMessage('The active invitation was revoked.')
      }
    } catch (error) {
      if (mounted.current) {
        setActionError(classifyError(error, 'Unable to revoke the invitation. Try again.'))
      }
      throw error
    } finally {
      finishMutation()
    }
  }, [beginMutation, finishMutation])

  const previewInvitation = useCallback(async (inviteCode: string) => {
    beginMutation()
    try {
      const invitationPreview = await previewPartnerInvitation({ inviteCode })
      if (mounted.current) {
        setPreview(invitationPreview)
        setActionError(null)
      }
      return invitationPreview
    } catch (error) {
      if (mounted.current) {
        setPreview(null)
        setActionError(classifyError(error, 'Unable to preview this invitation. Try again.'))
      }
      throw error
    } finally {
      finishMutation()
    }
  }, [beginMutation, finishMutation])

  const acceptInvitation = useCallback(async (inviteCode: string) => {
    beginMutation()
    let linkedAccount: PartnerLink
    try {
      linkedAccount = await acceptPartnerInvitation({ inviteCode })
      if (mounted.current) {
        setRawInvitation(null)
        setPreview(null)
      }
    } catch (error) {
      if (mounted.current) {
        setActionError(classifyError(error, 'Unable to connect with this partner. Try again.'))
      }
      throw error
    }

    let identityRefreshFailed = false
    try {
      await refreshIdentity()
    } catch {
      identityRefreshFailed = true
    }

    try {
      await loadPartnerState(true)
    } catch {
      // The load operation exposes a retryable error without repeating acceptance.
    }

    if (mounted.current) {
      setSuccessMessage(`Connected with ${linkedAccount.partnerDisplayName}.`)
      if (identityRefreshFailed) {
        setActionError({
          title: 'Session refresh needed',
          message: 'Your partner was connected, but current account details could not be refreshed. Try reloading partner information.',
          retryable: true,
        })
      }
    }
    return linkedAccount
  }, [beginMutation, loadPartnerState, refreshIdentity])

  const wrappedAcceptInvitation = useCallback(async (inviteCode: string) => {
    try {
      return await acceptInvitation(inviteCode)
    } finally {
      finishMutation()
    }
  }, [acceptInvitation, finishMutation])

  const partner = useMemo(() => {
    if (identity === null || eligibleParticipants.length !== 2) return null
    return eligibleParticipants.find((participant) => participant.profileId !== identity.profileId) ?? null
  }, [eligibleParticipants, identity])

  return {
    activeInvitation,
    rawInvitation,
    preview,
    eligibleParticipants,
    partner,
    linked: partner !== null,
    loading,
    refreshing,
    mutating,
    loadError,
    actionError,
    successMessage,
    reload,
    clearActionFeedback,
    clearPreview,
    createInvitation,
    revokeInvitation,
    previewInvitation,
    acceptInvitation: wrappedAcceptInvitation,
  }
}
