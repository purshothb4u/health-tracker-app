import type { CoupleChallengeProgress, ParticipantProgress } from '../types/CoupleChallenge'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { IconContainer, type IconContainerTone } from './ui/IconContainer'
import { ProgressBar, type ProgressBarTone } from './ui/ProgressBar'
import { StatusBadge, type StatusBadgeTone } from './ui/StatusBadge'

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

function participantIconTone(profileName: string): IconContainerTone {
  if (profileName === 'Husband') return 'husband'
  if (profileName === 'Wife') return 'wife'
  return 'primary'
}

function participantBadgeTone(profileName: string): StatusBadgeTone {
  if (profileName === 'Husband') return 'profile-husband'
  if (profileName === 'Wife') return 'profile-wife'
  return 'neutral'
}

function participantProgressTone(profileName: string): ProgressBarTone {
  if (profileName === 'Husband') return 'husband'
  if (profileName === 'Wife') return 'wife'
  return 'primary'
}

function participantCardClass(profileName: string): string {
  if (profileName === 'Husband') {
    return 'border-profile-husband-accent/25 bg-profile-husband-surface/60'
  }
  if (profileName === 'Wife') {
    return 'border-profile-wife-accent/25 bg-profile-wife-surface/60'
  }
  return 'border-app-border-muted bg-app-surface'
}

function ParticipantProgressCard({ participant }: { participant: ParticipantProgress }) {
  const percentageText = participant.progressPercentage === null
    ? 'Not available'
    : `${participant.progressPercentage.toFixed(2)}%`
  const currentText = participant.progressAvailable && participant.currentValue !== null
    ? `${numberFormatter.format(participant.currentValue)} ${participant.displayUnit}`
    : 'Not available'

  return (
    <div className={`min-w-0 space-y-4 rounded-card border p-4 ${participantCardClass(participant.profileName)}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconContainer aria-hidden="true" tone={participantIconTone(participant.profileName)}>
            <span className="text-sm font-bold">{participant.profileName.slice(0, 1)}</span>
          </IconContainer>
          <div className="min-w-0">
            <h4 className="break-words text-card-title text-app-primary">{participant.profileName}</h4>
            <StatusBadge tone={participantBadgeTone(participant.profileName)} className="mt-1">
              Participant
            </StatusBadge>
          </div>
        </div>
        <span className="shrink-0 text-metadata font-semibold tabular-nums text-app-secondary">
          {numberFormatter.format(participant.points)} points
        </span>
      </div>

      <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface/90 px-3 py-2.5">
          <dt className="text-metadata text-app-secondary">Current</dt>
          <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">{currentText}</dd>
        </div>
        <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface/90 px-3 py-2.5">
          <dt className="text-metadata text-app-secondary">Target</dt>
          <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">
            {numberFormatter.format(participant.targetValue)} {participant.displayUnit}
          </dd>
        </div>
      </dl>

      {!participant.progressAvailable ? (
        <Alert tone="information" title="Progress unavailable">
          {participant.message ?? 'Progress is not available.'}
        </Alert>
      ) : participant.progressPercentage === null ? (
        <p className="text-supporting font-medium text-app-secondary" role="status">
          Progress: Not available
        </p>
      ) : (
        <ProgressBar
          value={participant.progressPercentage}
          maximum={100}
          label={`${participant.profileName} progress`}
          valueText={percentageText}
          tone={participantProgressTone(participant.profileName)}
        />
      )}

      {participant.progressAvailable ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {participant.goalReached === true ? <StatusBadge tone="success">Target reached</StatusBadge> : null}
          {participant.goalReached === false ? <StatusBadge tone="neutral">In progress</StatusBadge> : null}
          {participant.message ? (
            <p className="min-w-0 flex-1 break-words text-supporting text-app-secondary">{participant.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function CoupleProgressComparison({ progress }: { progress: CoupleChallengeProgress }) {
  const leader = progress.participantProgress.find(
    (participant) => participant.userProfileId === progress.leaderUserProfileId,
  )

  return (
    <div className="min-w-0 space-y-4 rounded-card border border-profile-shared/30 bg-app-surface/75 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconContainer aria-hidden="true" tone="shared" size="small">
          <TrackingIcon name="shared" />
        </IconContainer>
        <p className="break-words text-card-title text-app-primary">Participant progress</p>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        {progress.participantProgress.map((participant) => (
          <ParticipantProgressCard key={participant.userProfileId} participant={participant} />
        ))}
      </div>

      <div className="min-w-0 space-y-2 border-t border-profile-shared/25 pt-4 text-supporting text-app-secondary">
        <p className="break-words font-semibold text-app-primary">{progress.outcome}</p>
        <p className="break-words">{progress.supportiveMessage}</p>
        <div className="flex min-w-0 flex-wrap gap-2 pt-1">
          {progress.tie ? <StatusBadge tone="neutral">Current progress is tied</StatusBadge> : null}
          {!progress.tie && leader ? (
            <StatusBadge tone="neutral">Current leader: {leader.profileName}</StatusBadge>
          ) : null}
          {progress.bothCompleted ? (
            <StatusBadge tone="success">Both participants reached the target</StatusBadge>
          ) : null}
        </div>
      </div>
    </div>
  )
}
