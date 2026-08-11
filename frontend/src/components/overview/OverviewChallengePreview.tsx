import { Link, useLocation } from 'react-router'
import type {
  OverviewChallengePreviewItem,
  OverviewSectionState,
} from '../../hooks/useOverviewData'
import { CHALLENGE_TYPE_LABELS } from '../../types/CoupleChallenge'
import { Alert } from '../ui/Alert'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { IconContainer, type IconContainerTone } from '../ui/IconContainer'
import { LoadingState } from '../ui/LoadingState'
import { ProgressBar, type ProgressBarTone } from '../ui/ProgressBar'
import { SectionHeader } from '../ui/SectionHeader'
import { StatusBadge, type StatusBadgeTone } from '../ui/StatusBadge'
import OverviewIcon from './OverviewIcon'

interface OverviewChallengePreviewProps {
  state: OverviewSectionState<OverviewChallengePreviewItem[]>
}

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

const sectionLinkClasses = 'inline-flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none'

function participantTone(profileName: string): IconContainerTone {
  if (profileName === 'Husband') return 'husband'
  if (profileName === 'Wife') return 'wife'
  return 'primary'
}

function participantBadgeTone(profileName: string): StatusBadgeTone {
  if (profileName === 'Husband') return 'profile-husband'
  if (profileName === 'Wife') return 'profile-wife'
  return 'information'
}

function participantProgressTone(profileName: string): ProgressBarTone {
  if (profileName === 'Husband') return 'husband'
  if (profileName === 'Wife') return 'wife'
  return 'primary'
}

function ChallengeLink() {
  const location = useLocation()
  return (
    <Link className={sectionLinkClasses} to={{ pathname: '/goals', search: location.search }}>
      View challenges
      <OverviewIcon name="arrow" className="h-4 w-4" />
    </Link>
  )
}

export default function OverviewChallengePreview({ state }: OverviewChallengePreviewProps) {
  const item = state.data?.[0] ?? null

  return (
    <section aria-labelledby="overview-challenge-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-challenge-heading"
        title="Together"
        description="A shared goal, with each person’s real progress kept visible and distinct."
        actions={<ChallengeLink />}
      />
      {state.loading && state.data === null ? <LoadingState message="Loading shared challenge..." /> : null}
      {state.error && state.data === null ? (
        <Alert tone="error" title="Shared challenge unavailable">{state.error}</Alert>
      ) : null}
      {state.data !== null && item === null ? (
        <EmptyState
          compact
          className="border-profile-shared/35 bg-profile-shared-surface/60"
          icon={<OverviewIcon name="shared" />}
          iconTone="shared"
          title="No active shared challenge"
          description="A shared challenge will appear here when both profiles are participating."
          action={<ChallengeLink />}
        />
      ) : null}
      {item ? (
        <Card
          as="article"
          padding="normal"
          elevated
          className="min-w-0 border-profile-shared/30 bg-profile-shared-surface/70"
        >
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <IconContainer aria-hidden="true" tone="shared" size="large">
                <OverviewIcon name="shared" />
              </IconContainer>
              <div className="min-w-0">
                <p className="text-metadata font-semibold text-app-secondary">
                  {CHALLENGE_TYPE_LABELS[item.challenge.challengeType]}
                </p>
                <h3 className="mt-1 break-words text-section-title text-app-primary">
                  {item.challenge.title}
                </h3>
                <p className="mt-1.5 break-words text-supporting text-app-secondary">
                  {item.challenge.participants.map((participant) => participant.profileName).join(' and ')}
                </p>
              </div>
            </div>
            <StatusBadge tone="profile-shared" className="shrink-0">Shared challenge</StatusBadge>
          </div>

          {item.progress === null ? (
            <Alert className="mt-5" tone="information" title="Progress unavailable">
              {item.progressError ?? 'Shared progress is currently unavailable.'}
            </Alert>
          ) : (
            <>
              <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
                {item.progress.participantProgress.map((participant) => (
                  <div
                    key={participant.userProfileId}
                    className="min-w-0 rounded-card border border-app-border-muted bg-app-surface p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <IconContainer aria-hidden="true" tone={participantTone(participant.profileName)}>
                          <span className="text-sm font-bold">{participant.profileName.slice(0, 1)}</span>
                        </IconContainer>
                        <div className="min-w-0">
                          <h4 className="break-words text-card-title text-app-primary">
                            {participant.profileName}
                          </h4>
                          <StatusBadge tone={participantBadgeTone(participant.profileName)} className="mt-1">
                            Participant
                          </StatusBadge>
                        </div>
                      </div>
                      <span className="shrink-0 text-metadata font-semibold tabular-nums text-app-secondary">
                        {numberFormatter.format(participant.points)} points
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-metadata font-medium text-app-secondary">Current</p>
                          <p className="mt-1 break-words text-xl font-bold tabular-nums text-app-primary">
                            {participant.currentValue === null
                              ? 'Not available'
                              : numberFormatter.format(participant.currentValue)}
                            {participant.currentValue === null ? '' : ` ${participant.displayUnit}`}
                          </p>
                        </div>
                        <div className="min-w-0 text-left sm:text-right">
                          <p className="text-metadata font-medium text-app-secondary">Target</p>
                          <p className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">
                            {numberFormatter.format(participant.targetValue)} {participant.displayUnit}
                          </p>
                        </div>
                      </div>

                      {!participant.progressAvailable ? (
                        <Alert tone="information" title="Progress unavailable">
                          {participant.message ?? 'Progress is not available.'}
                        </Alert>
                      ) : participant.progressPercentage === null ? (
                        <p className="text-supporting text-app-secondary">Progress: Not available</p>
                      ) : (
                        <ProgressBar
                          value={participant.progressPercentage}
                          maximum={100}
                          label={`${participant.profileName} progress`}
                          valueText={`${participant.progressPercentage.toFixed(2)}%`}
                          tone={participantProgressTone(participant.profileName)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-profile-shared/25 pt-5 text-supporting text-app-secondary">
                <p className="break-words font-semibold text-app-primary">{item.progress.outcome}</p>
                <p className="break-words">{item.progress.supportiveMessage}</p>
                <div className="flex min-w-0 flex-wrap gap-2 pt-1">
                  {item.progress.tie ? (
                    <StatusBadge tone="neutral">Current progress is tied</StatusBadge>
                  ) : null}
                  {!item.progress.tie && item.progress.leaderUserProfileId !== null ? (
                    <StatusBadge tone="neutral">
                      Current leader: {item.progress.participantProgress.find(
                        (participant) => participant.userProfileId === item.progress?.leaderUserProfileId,
                      )?.profileName ?? 'Not available'}
                    </StatusBadge>
                  ) : null}
                  {item.progress.bothCompleted ? (
                    <StatusBadge tone="success">Both participants reached the target</StatusBadge>
                  ) : null}
                </div>
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
