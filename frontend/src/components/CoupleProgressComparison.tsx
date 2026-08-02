import type { CoupleChallengeProgress, ParticipantProgress } from '../types/CoupleChallenge'

function ParticipantProgressCard({ participant }: { participant: ParticipantProgress }) {
  if (!participant.progressAvailable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="font-semibold text-gray-900">{participant.profileName}</p>
        <p className="mt-2 text-sm text-gray-500">{participant.message ?? 'Progress is not available.'}</p>
      </div>
    )
  }

  const visiblePercentage = participant.progressPercentage ?? 0
  const cappedPercentage = Math.min(Math.max(visiblePercentage, 0), 100)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900">{participant.profileName}</p>
        <span className="text-xs font-semibold text-gray-600">{participant.points} points</span>
      </div>
      <p className="mt-2 text-sm text-gray-700">
        {participant.currentValue ?? 'Not available'} / {participant.targetValue} {participant.displayUnit}
      </p>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200" aria-label={`${participant.profileName} progress`}>
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${cappedPercentage}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {participant.progressPercentage === null ? 'Not available' : `${participant.progressPercentage.toFixed(2)}%`}
      </p>
      {participant.goalReached === true && <p className="mt-1 text-xs font-medium text-green-700">Target reached.</p>}
      {participant.goalReached === false && <p className="mt-1 text-xs font-medium text-gray-600">Target not yet reached.</p>}
      {participant.message && <p className="mt-2 text-xs text-gray-500">{participant.message}</p>}
    </div>
  )
}

export default function CoupleProgressComparison({ progress }: { progress: CoupleChallengeProgress }) {
  const leader = progress.participantProgress.find(
    (participant) => participant.userProfileId === progress.leaderUserProfileId,
  )

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {progress.participantProgress.map((participant) => (
          <ParticipantProgressCard key={participant.userProfileId} participant={participant} />
        ))}
      </div>
      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p className="font-medium">{progress.outcome}</p>
        <p>{progress.supportiveMessage}</p>
        {progress.tie && <p className="text-xs text-gray-600">Current result: tie</p>}
        {!progress.tie && leader && <p className="text-xs text-gray-600">Current leader: {leader.profileName}</p>}
        {progress.bothCompleted && <p className="text-xs font-semibold text-green-700">Both participants reached the target.</p>}
      </div>
    </div>
  )
}
