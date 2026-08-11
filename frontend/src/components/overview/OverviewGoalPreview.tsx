import { Link, useLocation } from 'react-router'
import type { OverviewSectionState, OverviewGoalPreviewItem } from '../../hooks/useOverviewData'
import { GOAL_TYPE_LABELS } from '../../types/Goal'
import { Alert } from '../ui/Alert'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { IconContainer } from '../ui/IconContainer'
import { LoadingState } from '../ui/LoadingState'
import { ProgressBar } from '../ui/ProgressBar'
import { SectionHeader } from '../ui/SectionHeader'
import { StatusBadge } from '../ui/StatusBadge'
import OverviewIcon from './OverviewIcon'

interface OverviewGoalPreviewProps {
  state: OverviewSectionState<OverviewGoalPreviewItem[]>
}

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

const sectionLinkClasses = 'inline-flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none'

function GoalLink({ label = 'View goals' }: { label?: string }) {
  const location = useLocation()
  return (
    <Link className={sectionLinkClasses} to={{ pathname: '/goals', search: location.search }}>
      {label}
      <OverviewIcon name="arrow" className="h-4 w-4" />
    </Link>
  )
}

export default function OverviewGoalPreview({ state }: OverviewGoalPreviewProps) {
  const goals = state.data ?? []

  return (
    <section aria-labelledby="overview-goals-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-goals-heading"
        title="My progress"
        description="Personal goals turn daily tracking into steady, visible progress."
        actions={<GoalLink />}
      />
      {state.loading && state.data === null ? <LoadingState message="Loading active goals..." /> : null}
      {state.error && state.data === null ? (
        <Alert tone="error" title="Active goals unavailable">{state.error}</Alert>
      ) : null}
      {state.data !== null && goals.length === 0 ? (
        <EmptyState
          compact
          icon={<OverviewIcon name="target" />}
          iconTone="primary"
          title="No active personal goals"
          description="Create a goal when you are ready to track a new target."
          action={<GoalLink label="View goals" />}
        />
      ) : null}
      {goals.length > 0 ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {goals.map(({ goal, progress, progressError }, index) => (
            <Card
              key={goal.id}
              as="article"
              padding="normal"
              elevated={index === 0}
              className="min-w-0 border-primary-100 bg-primary-50/70"
            >
              <div className="flex min-w-0 items-start gap-3">
                <IconContainer aria-hidden="true" tone="primary" size={index === 0 ? 'large' : 'normal'}>
                  <OverviewIcon name="target" />
                </IconContainer>
                <div className="min-w-0 flex-1">
                  <p className="text-metadata font-semibold text-primary-700">
                    {GOAL_TYPE_LABELS[goal.goalType]}
                  </p>
                  <h3 className="mt-1 break-words text-card-title text-app-primary">
                    {goal.title}
                  </h3>
                </div>
                {progress ? (
                  <StatusBadge tone="neutral" className="shrink-0 tabular-nums">
                    {numberFormatter.format(progress.points)} points
                  </StatusBadge>
                ) : null}
              </div>

              {progress === null ? (
                <Alert className="mt-4" tone="information" title="Progress unavailable">
                  {progressError ?? 'Progress is currently unavailable.'}
                </Alert>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-metadata font-medium text-app-secondary">Current</p>
                      <p className="mt-1 break-words text-xl font-bold tabular-nums text-app-primary">
                        {progress.currentValue === null
                          ? 'Not available'
                          : numberFormatter.format(progress.currentValue)}
                        {progress.currentValue === null ? '' : ` ${progress.displayUnit}`}
                      </p>
                    </div>
                    <div className="min-w-0 text-left sm:text-right">
                      <p className="text-metadata font-medium text-app-secondary">Target</p>
                      <p className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">
                        {numberFormatter.format(progress.targetValue)} {progress.displayUnit}
                      </p>
                    </div>
                  </div>

                  {!progress.progressAvailable ? (
                    <Alert tone="information" title="Progress unavailable">
                      {progress.message ?? 'Progress is currently unavailable.'}
                    </Alert>
                  ) : progress.progressPercentage === null ? (
                    <p className="text-supporting text-app-secondary">Goal progress: Not available</p>
                  ) : (
                    <ProgressBar
                      value={progress.progressPercentage}
                      maximum={100}
                      label="Goal progress"
                      valueText={`${progress.progressPercentage.toFixed(2)}%`}
                      tone="primary"
                    />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : null}
      {state.data !== null && state.loading ? (
        <LoadingState compact message="Refreshing active goals..." />
      ) : null}
      {state.data !== null && state.error ? (
        <Alert tone="warning" title="Showing previously loaded goals">{state.error}</Alert>
      ) : null}
    </section>
  )
}
