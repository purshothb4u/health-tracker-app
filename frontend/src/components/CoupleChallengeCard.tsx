import type { ChallengeStatus, CoupleChallenge, CoupleChallengeProgress } from '../types/CoupleChallenge'
import { CHALLENGE_STATUS_LABELS, CHALLENGE_TYPE_LABELS } from '../types/CoupleChallenge'
import { formatLocalDate } from '../utils/dateFormatting'
import CoupleProgressComparison from './CoupleProgressComparison'
import GoalCheckInControl from './GoalCheckInControl'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { LoadingState } from './ui/LoadingState'
import { StatusBadge, type StatusBadgeTone } from './ui/StatusBadge'

interface CoupleChallengeCardProps {
  challenge: CoupleChallenge
  progress: CoupleChallengeProgress | undefined
  mutating: boolean
  onEdit: (challenge: CoupleChallenge) => void
  onStatus: (challengeId: number, status: Extract<ChallengeStatus, 'COMPLETED' | 'CANCELLED'>) => Promise<void>
  onDelete: (challengeId: number) => Promise<void>
  onCheckIn: (challengeId: number, userProfileId: number, date: string, completed: boolean, notes: string | null) => Promise<unknown>
}

function statusTone(status: ChallengeStatus): StatusBadgeTone {
  if (status === 'UPCOMING') return 'warning'
  if (status === 'ACTIVE') return 'information'
  if (status === 'COMPLETED') return 'success'
  return 'neutral'
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

  return (
    <Card as="article" padding="normal" className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-app-primary">{challenge.title}</h3>
          <p className="mt-1 break-words text-sm leading-6 text-app-secondary">
            {CHALLENGE_TYPE_LABELS[challenge.challengeType]} &middot; {formatLocalDate(challenge.startDate)} to {formatLocalDate(challenge.endDate)}
          </p>
        </div>
        <StatusBadge tone={statusTone(challenge.status)}>
          {CHALLENGE_STATUS_LABELS[challenge.status]}
        </StatusBadge>
      </div>

      {challenge.notes ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-app-secondary">
          {challenge.notes}
        </p>
      ) : null}

      {progress ? (
        <CoupleProgressComparison progress={progress} />
      ) : (
        <LoadingState compact message={`Loading progress for ${challenge.title}...`} />
      )}

      {challenge.status === 'ACTIVE' && challenge.challengeType === 'CUSTOM_CHECK_IN' ? (
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {challenge.participants.map((participant) => (
            <GoalCheckInControl
              key={participant.userProfileId}
              endDate={challenge.endDate}
              label={`${participant.profileName} challenge check-in`}
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
      ) : null}

      <div className="flex flex-col gap-2 border-t border-app-border pt-4 sm:flex-row sm:flex-wrap" aria-label={`Actions for ${challenge.title}`}>
        {editable ? (
          <Button variant="secondary" disabled={mutating} aria-label={`Edit ${challenge.title}`} onClick={() => onEdit(challenge)}>
            Edit
          </Button>
        ) : null}
        {challenge.status === 'ACTIVE' ? (
          <Button disabled={mutating} aria-label={`Complete ${challenge.title}`} onClick={() => void onStatus(challenge.id, 'COMPLETED')}>
            Complete challenge
          </Button>
        ) : null}
        {editable ? (
          <Button variant="secondary" disabled={mutating} aria-label={`Cancel ${challenge.title}`} onClick={() => void onStatus(challenge.id, 'CANCELLED')}>
            Cancel challenge
          </Button>
        ) : null}
        <Button variant="destructive" disabled={mutating} aria-label={`Delete ${challenge.title}`} onClick={() => void onDelete(challenge.id)}>
          Delete challenge
        </Button>
      </div>
    </Card>
  )
}
