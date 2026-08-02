import { useState } from 'react'
import { useCoupleChallenges } from '../hooks/useCoupleChallenges'
import type { ChallengeStatus, CoupleChallenge, CoupleChallengeRequest } from '../types/CoupleChallenge'
import { CHALLENGE_STATUS_LABELS } from '../types/CoupleChallenge'
import AchievementBadge from './AchievementBadge'
import CoupleChallengeCard from './CoupleChallengeCard'
import CoupleChallengeForm from './CoupleChallengeForm'

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
    const saved = editingChallenge
      ? await challengeState.updateChallenge(editingChallenge.id, data)
      : await challengeState.createChallenge(data)
    setShowForm(false)
    setEditingChallenge(null)
    setSuccessMessage(editingChallenge ? 'Couple challenge updated.' : 'Couple challenge created.')
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
    if (!window.confirm('Delete this couple challenge? This action cannot be undone.')) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      await challengeState.deleteChallenge(challengeId)
      setSuccessMessage('Couple challenge deleted.')
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to delete couple challenge.'))
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
    <section className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Couple Challenges</h3>
          <p className="mt-1 text-sm text-gray-600">Shared progress for Husband and Wife</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={!canCreate || challengeState.mutating} type="button" onClick={beginCreate}>
          Add challenge
        </button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Couple challenge status filter">
        {filters.map((filter) => {
          const selected = challengeState.statusFilter === filter.value
          return (
            <button
              key={filter.label}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${selected ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 ring-1 ring-indigo-100'}`}
              disabled={challengeState.loading}
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingChallenge(null)
                challengeState.setStatusFilter(filter.value)
              }}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <CoupleChallengeForm
          editingChallenge={editingChallenge}
          mutating={challengeState.mutating}
          participantUserProfileIds={participantUserProfileIds}
          onCancel={() => { setShowForm(false); setEditingChallenge(null) }}
          onSubmit={saveChallenge}
        />
      )}

      {challengeState.refreshing && <p className="text-sm text-gray-500">Refreshing couple challenges...</p>}
      {(actionError || challengeState.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
          <p className="text-sm font-medium text-red-700">{actionError ?? challengeState.error}</p>
          <button className="mt-2 text-sm font-semibold text-red-700 underline" type="button" onClick={challengeState.reload}>Retry</button>
        </div>
      )}
      {successMessage && <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700" role="status">{successMessage}</p>}

      {initialLoading ? (
        <p className="rounded-xl bg-white p-4 text-sm text-gray-500">Loading couple challenges...</p>
      ) : challengeState.challenges.length === 0 ? (
        <p className="rounded-xl border border-dashed border-indigo-200 bg-white p-5 text-center text-sm text-gray-500">No couple challenges match this filter.</p>
      ) : (
        <div className="space-y-3">
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

      {achievements.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Couple achievements</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <AchievementBadge key={`${achievement.achievementType}-${achievement.challengeId ?? 'none'}`} achievement={achievement} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
