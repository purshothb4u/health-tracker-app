import type { CoupleChallengeProgress, ParticipantProgress } from '../types/CoupleChallenge'
import { Alert } from './ui/Alert'
import { ProgressBar } from './ui/ProgressBar'
import { StatusBadge } from './ui/StatusBadge'

function ParticipantProgressCard({ participant }: { participant: ParticipantProgress }) {
  if (!participant.progressAvailable) {
    return (
      <div className="min-w-0 rounded-xl border border-app-border bg-app-surface p-4">
        <h4 className="break-words font-semibold text-app-primary">{participant.profileName}</h4>
        <Alert className="mt-3" tone="information" title="Progress unavailable">
          {participant.message ?? 'Progress is not available.'}
        </Alert>
      </div>
    )
  }

  const percentageText = participant.progressPercentage === null
    ? 'Not available'
    : `${participant.progressPercentage.toFixed(2)}%`

  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-app-border bg-app-surface p-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h4 className="break-words font-semibold text-app-primary">{participant.profileName}</h4>
        <StatusBadge tone="information">{participant.points} points</StatusBadge>
      </div>
      <p className="break-words text-sm text-app-secondary">
        {participant.currentValue ?? 'Not available'} / {participant.targetValue} {participant.displayUnit}
      </p>
      {participant.progressPercentage === null ? (
        <p className="text-sm font-medium text-app-secondary" role="status">
          Percentage is not available.
        </p>
      ) : (
        <ProgressBar
          value={participant.progressPercentage}
          maximum={100}
          label={`${participant.profileName} progress`}
          valueText={percentageText}
        />
      )}
      {participant.goalReached === true ? (
        <p className="text-sm font-medium text-success">Target reached.</p>
      ) : null}
      {participant.goalReached === false ? (
        <p className="text-sm font-medium text-app-secondary">Target not yet reached.</p>
      ) : null}
      {participant.message ? (
        <p className="break-words text-sm leading-6 text-app-secondary">{participant.message}</p>
      ) : null}
    </div>
  )
}

export default function CoupleProgressComparison({ progress }: { progress: CoupleChallengeProgress }) {
  const leader = progress.participantProgress.find(
    (participant) => participant.userProfileId === progress.leaderUserProfileId,
  )

  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-primary-100 bg-primary-50/40 p-4">
      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        {progress.participantProgress.map((participant) => (
          <ParticipantProgressCard key={participant.userProfileId} participant={participant} />
        ))}
      </div>
      <div className="min-w-0 space-y-2 border-t border-primary-100 pt-4 text-sm leading-6 text-app-secondary">
        <p className="break-words font-semibold text-app-primary">{progress.outcome}</p>
        <p className="break-words">{progress.supportiveMessage}</p>
        {progress.tie ? <StatusBadge tone="information">Current result: tie</StatusBadge> : null}
        {!progress.tie && leader ? (
          <StatusBadge tone="information">Current leader: {leader.profileName}</StatusBadge>
        ) : null}
        {progress.bothCompleted ? (
          <p className="break-words font-semibold text-success">Both participants reached the target.</p>
        ) : null}
      </div>
    </div>
  )
}
