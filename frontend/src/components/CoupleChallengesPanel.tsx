import { useState } from 'react'
import { useCoupleChallenges } from '../hooks/useCoupleChallenges'
import type { ChallengeStatus, CoupleChallenge, CoupleChallengeRequest } from '../types/CoupleChallenge'
import { CHALLENGE_STATUS_LABELS } from '../types/CoupleChallenge'
import AchievementBadge from './AchievementBadge'
import CoupleChallengeCard from './CoupleChallengeCard'
import CoupleChallengeForm from './CoupleChallengeForm'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { EmptyState } from './ui/EmptyState'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface CoupleChallengesPanelProps {
  participantUserProfileIds: readonly number[]
}

const filters: Array<{ value: ChallengeStatus | null; label: string }> = [
  { value: null, label: 'All' },
  ...Object.entries(CHALLENGE_STATUS_LABELS).map(([value, label]) => ({
    value: value as ChallengeStatus,
    label,
  })),
]

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export default function CoupleChallengesPanel({ participantUserProfileIds }: CoupleChallengesPanelProps) {
  const challengeState = useCoupleChallenges(participantUserProfileIds)
  const [showForm, setShowForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<CoupleChallenge | null>(null)
  const [pendingDeleteChallenge, setPendingDeleteChallenge] = useState<Pick<CoupleChallenge, 'id' | 'title'> | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const canCreate = participantUserProfileIds.length === 2
    && participantUserProfileIds[0] !== participantUserProfileIds[1]

  function beginCreate() {
    setEditingChallenge(null)
    setActionError(null)
    setSuccessMessage(null)
    setShowForm(true)
  }

  function beginEdit(challenge: CoupleChallenge) {
    setEditingChallenge(challenge)
    setActionError(null)
    setSuccessMessage(null)
    setShowForm(true)
  }

  async function saveChallenge(data: CoupleChallengeRequest): Promise<CoupleChallenge> {
    setActionError(null)
    setSuccessMessage(null)
    const updating = editingChallenge !== null
    const saved = updating
      ? await challengeState.updateChallenge(editingChallenge.id, data)
      : await challengeState.createChallenge(data)
    setShowForm(false)
    setEditingChallenge(null)
    setSuccessMessage(updating ? 'Couple challenge updated.' : 'Couple challenge created.')
    return saved
  }

  async function changeStatus(challengeId: number, status: Extract<ChallengeStatus, 'COMPLETED' | 'CANCELLED'>) {
    setActionError(null)
    setSuccessMessage(null)
    try {
      await challengeState.updateChallengeStatus(challengeId, { status })
      setSuccessMessage(status === 'COMPLETED' ? 'Couple challenge completed.' : 'Couple challenge cancelled.')
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to update couple challenge status.'))
    }
  }

  async function removeChallenge(challengeId: number) {
    setActionError(null)
    setSuccessMessage(null)
    const challenge = challengeState.challenges.find((candidate) => candidate.id === challengeId)
    setPendingDeleteChallenge({ id: challengeId, title: challenge?.title ?? 'this challenge' })
  }

  async function confirmRemoveChallenge() {
    if (pendingDeleteChallenge === null) return
    const challengeId = pendingDeleteChallenge.id
    setActionError(null)
    setSuccessMessage(null)
    try {
      await challengeState.deleteChallenge(challengeId)
      if (editingChallenge?.id === challengeId) {
        setEditingChallenge(null)
        setShowForm(false)
      }
      setSuccessMessage('Couple challenge deleted.')
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to delete couple challenge.'))
    } finally {
      setPendingDeleteChallenge(null)
    }
  }

  async function saveCheckIn(
    challengeId: number,
    userProfileId: number,
    date: string,
    completed: boolean,
    notes: string | null,
  ) {
    setActionError(null)
    setSuccessMessage(null)
    try {
      const result = await challengeState.upsertParticipantCheckIn(
        challengeId,
        userProfileId,
        date,
        { completed, notes },
      )
      setSuccessMessage('Challenge check-in saved.')
      return result
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to save challenge check-in.'))
      throw error
    }
  }

  const achievements = participantUserProfileIds
    .flatMap((userProfileId) => challengeState.achievementsByUserProfileId[userProfileId] ?? [])
    .filter((achievement, index, all) => all.findIndex((candidate) => (
      candidate.achievementType === achievement.achievementType
      && candidate.challengeId === achievement.challengeId
    )) === index)
  const initialLoading = challengeState.loading && challengeState.challenges.length === 0

  return (
    <Card as="section" padding="normal" className="min-w-0 space-y-5" aria-labelledby="shared-couple-challenges-heading">
      <SectionHeader
        headingId="shared-couple-challenges-heading"
        headingLevel={2}
        title="Shared couple challenges"
        description="Shared progress for Husband and Wife, independent of the active personal-goal profile."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="information">Shared by both profiles</StatusBadge>
            <Button disabled={!canCreate || challengeState.mutating} onClick={beginCreate}>
              Add challenge
            </Button>
          </div>
        )}
      />

      {!canCreate ? (
        <Alert tone="warning" title="Two profiles required">
          Couple challenges require two distinct loaded profiles.
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Couple challenge status filter">
        {filters.map((filter) => {
          const selected = challengeState.statusFilter === filter.value
          return (
            <Button
              key={filter.label}
              variant={selected ? 'primary' : 'secondary'}
              aria-pressed={selected}
              disabled={challengeState.loading || challengeState.mutating}
              onClick={() => {
                setShowForm(false)
                setEditingChallenge(null)
                challengeState.setStatusFilter(filter.value)
              }}
            >
              {filter.label}
            </Button>
          )
        })}
      </div>

      {showForm ? (
        <CoupleChallengeForm
          editingChallenge={editingChallenge}
          mutating={challengeState.mutating}
          participantUserProfileIds={participantUserProfileIds}
          onCancel={() => { setShowForm(false); setEditingChallenge(null) }}
          onSubmit={saveChallenge}
        />
      ) : null}

      {challengeState.refreshing ? <LoadingState compact message="Refreshing shared challenges..." /> : null}
      {actionError || challengeState.error ? (
        <Alert
          tone="error"
          title="Unable to update shared challenges"
          action={<Button variant="secondary" size="compact" disabled={challengeState.mutating} onClick={challengeState.reload}>Retry</Button>}
        >
          {actionError ?? challengeState.error}
        </Alert>
      ) : null}
      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}

      {initialLoading ? (
        <LoadingState message="Loading shared couple challenges..." />
      ) : challengeState.challenges.length === 0 ? (
        <EmptyState
          title="No shared challenges match this filter"
          description="Choose another status or create a challenge for both profiles."
        />
      ) : (
        <div className="grid min-w-0 gap-4">
          {challengeState.challenges.map((challenge) => (
            <CoupleChallengeCard
              key={challenge.id}
              challenge={challenge}
              mutating={challengeState.mutating}
              progress={challengeState.progressByChallengeId[challenge.id]}
              onCheckIn={saveCheckIn}
              onDelete={removeChallenge}
              onEdit={beginEdit}
              onStatus={changeStatus}
            />
          ))}
        </div>
      )}

      {achievements.length > 0 ? (
        <section className="min-w-0 space-y-3" aria-labelledby="couple-achievements-heading">
          <SectionHeader
            headingId="couple-achievements-heading"
            headingLevel={3}
            title="Couple achievements"
            description="Achievements earned through shared challenges."
          />
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <AchievementBadge key={`${achievement.achievementType}-${achievement.challengeId ?? 'none'}`} achievement={achievement} />
            ))}
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteChallenge !== null}
        title="Delete shared challenge?"
        description={pendingDeleteChallenge
          ? `“${pendingDeleteChallenge.title}” and its participant check-ins will be permanently removed. This action cannot be undone.`
          : ''}
        confirmLabel="Delete challenge"
        confirmingLabel="Deleting challenge..."
        confirming={challengeState.mutating}
        onCancel={() => setPendingDeleteChallenge(null)}
        onConfirm={() => { void confirmRemoveChallenge() }}
      />
    </Card>
  )
}
