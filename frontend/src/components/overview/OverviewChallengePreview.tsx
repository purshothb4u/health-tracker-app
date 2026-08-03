import { Link, useLocation } from 'react-router'
import type {
  OverviewChallengePreviewItem,
  OverviewSectionState,
} from '../../hooks/useOverviewData'
import { CHALLENGE_TYPE_LABELS } from '../../types/CoupleChallenge'
import { Alert } from '../ui/Alert'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { ProgressBar } from '../ui/ProgressBar'
import { SectionHeader } from '../ui/SectionHeader'
import { StatusBadge } from '../ui/StatusBadge'

interface OverviewChallengePreviewProps {
  state: OverviewSectionState<OverviewChallengePreviewItem[]>
}

const sectionLinkClasses = 'inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2'

export default function OverviewChallengePreview({ state }: OverviewChallengePreviewProps) {
  const location = useLocation()
  const item = state.data?.[0] ?? null

  return (
    <section aria-labelledby="overview-challenge-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-challenge-heading"
        title="Shared challenge"
        description="Progress shared by the participating profiles."
        actions={(
          <Link className={sectionLinkClasses} to={{ pathname: '/goals', search: location.search }}>
            View challenges
          </Link>
        )}
      />
      {state.loading && state.data === null ? <LoadingState message="Loading shared challenge..." /> : null}
      {state.error && state.data === null ? (
        <Alert tone="error" title="Shared challenge unavailable">{state.error}</Alert>
      ) : null}
      {state.data !== null && item === null ? (
        <EmptyState
          compact
          title="No active shared challenge"
          description="A shared challenge will appear here when both profiles are participating."
        />
      ) : null}
      {item ? (
        <Card as="article" padding="normal" className="min-w-0 space-y-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                {CHALLENGE_TYPE_LABELS[item.challenge.challengeType]}
              </p>
              <h3 className="mt-1 break-words text-lg font-semibold text-app-primary">
                {item.challenge.title}
              </h3>
              <p className="mt-1 break-words text-sm text-app-secondary">
                Participants: {item.challenge.participants.map((participant) => participant.profileName).join(' and ')}
              </p>
            </div>
            <StatusBadge tone="information">Shared</StatusBadge>
          </div>
          {item.progress === null ? (
            <Alert tone="information" title="Progress unavailable">
              {item.progressError ?? 'Shared progress is currently unavailable.'}
            </Alert>
          ) : (
            <>
              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                {item.progress.participantProgress.map((participant) => (
                  <div key={participant.userProfileId} className="min-w-0 rounded-xl border border-app-border bg-slate-50 p-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <h4 className="break-words font-semibold text-app-primary">{participant.profileName}</h4>
                      <span className="shrink-0 text-sm text-app-secondary">{participant.points} points</span>
                    </div>
                    {!participant.progressAvailable ? (
                      <p className="mt-2 break-words text-sm text-app-secondary">
                        {participant.message ?? 'Progress is not available.'}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <p className="break-words text-sm text-app-secondary">
                          {participant.currentValue ?? 'Not available'} / {participant.targetValue} {participant.displayUnit}
                        </p>
                        {participant.progressPercentage === null ? (
                          <p className="text-sm text-app-secondary">Percentage: Not available</p>
                        ) : (
                          <ProgressBar
                            value={participant.progressPercentage}
                            maximum={100}
                            label={`${participant.profileName} progress`}
                            valueText={`${participant.progressPercentage.toFixed(2)}%`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-app-border pt-4 text-sm leading-6 text-app-secondary">
                <p className="break-words font-semibold text-app-primary">{item.progress.outcome}</p>
                <p className="break-words">{item.progress.supportiveMessage}</p>
                {item.progress.tie ? <StatusBadge tone="information">Current result: tie</StatusBadge> : null}
                {!item.progress.tie && item.progress.leaderUserProfileId !== null ? (
                  <StatusBadge tone="information">
                    Current leader: {item.progress.participantProgress.find(
                      (participant) => participant.userProfileId === item.progress?.leaderUserProfileId,
                    )?.profileName ?? 'Not available'}
                  </StatusBadge>
                ) : null}
                {item.progress.bothCompleted ? (
                  <p className="font-semibold text-success">Both participants reached the target.</p>
                ) : null}
              </div>
            </>
          )}
        </Card>
      ) : null}
      {state.data !== null && state.loading ? (
        <LoadingState compact message="Refreshing shared challenge..." />
      ) : null}
      {state.data !== null && state.error ? (
        <Alert tone="warning" title="Showing previously loaded challenge">{state.error}</Alert>
      ) : null}
    </section>
  )
}
