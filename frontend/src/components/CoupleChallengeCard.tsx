import type { ChallengeStatus, CoupleChallenge, CoupleChallengeProgress } from '../types/CoupleChallenge'
import { CHALLENGE_STATUS_LABELS, CHALLENGE_TYPE_LABELS } from '../types/CoupleChallenge'
import CoupleProgressComparison from './CoupleProgressComparison'
import GoalCheckInControl from './GoalCheckInControl'

interface CoupleChallengeCardProps {
  challenge: CoupleChallenge
  progress: CoupleChallengeProgress | undefined
  mutating: boolean
  onEdit: (challenge: CoupleChallenge) => void
  onStatus: (challengeId: number, status: Extract<ChallengeStatus, 'COMPLETED' | 'CANCELLED'>) => Promise<void>
  onDelete: (challengeId: number) => Promise<void>
  onCheckIn: (challengeId: number, userProfileId: number, date: string, completed: boolean, notes: string | null) => Promise<unknown>
}

export default function CoupleChallengeCard({
  challenge,
  progress,
  mutating,
  onEdit,
  onStatus,
  onDelete,
  onCheckIn,
}: CoupleChallengeCardProps) {
  const editable = challenge.status === 'UPCOMING' || challenge.status === 'ACTIVE'
  const buttonClass = 'rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <article className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
          <p className="mt-1 text-xs text-gray-500">{CHALLENGE_TYPE_LABELS[challenge.challengeType]} &middot; {challenge.startDate} to {challenge.endDate}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{CHALLENGE_STATUS_LABELS[challenge.status]}</span>
      </div>
      {challenge.notes && <p className="text-sm text-gray-600">{challenge.notes}</p>}
      {progress ? <CoupleProgressComparison progress={progress} /> : <p className="text-sm text-gray-500">Loading progress...</p>}

      {challenge.status === 'ACTIVE' && challenge.challengeType === 'CUSTOM_CHECK_IN' && (
        <div className="grid gap-3 md:grid-cols-2">
          {challenge.participants.map((participant) => (
            <GoalCheckInControl
              key={participant.userProfileId}
              endDate={challenge.endDate}
              label={`${participant.profileName} check-in`}
              mutating={mutating}
              startDate={challenge.startDate}
              onSubmit={(date, data) => onCheckIn(
                challenge.id,
                participant.userProfileId,
                date,
                data.completed,
                data.notes ?? null,
              )}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {editable && <button className={`${buttonClass} border-gray-300 text-gray-700`} disabled={mutating} type="button" onClick={() => onEdit(challenge)}>Edit</button>}
        {challenge.status === 'ACTIVE' && <button className={`${buttonClass} border-green-300 text-green-700`} disabled={mutating} type="button" onClick={() => void onStatus(challenge.id, 'COMPLETED')}>Complete</button>}
        {editable && <button className={`${buttonClass} border-amber-300 text-amber-700`} disabled={mutating} type="button" onClick={() => void onStatus(challenge.id, 'CANCELLED')}>Cancel</button>}
        <button className={`${buttonClass} border-red-300 text-red-700`} disabled={mutating} type="button" onClick={() => void onDelete(challenge.id)}>Delete</button>
      </div>
    </article>
  )
}
