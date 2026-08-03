import { Link, useLocation } from 'react-router'
import type { OverviewSectionState, OverviewGoalPreviewItem } from '../../hooks/useOverviewData'
import { GOAL_TYPE_LABELS } from '../../types/Goal'
import { Alert } from '../ui/Alert'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { ProgressBar } from '../ui/ProgressBar'
import { SectionHeader } from '../ui/SectionHeader'

interface OverviewGoalPreviewProps {
  state: OverviewSectionState<OverviewGoalPreviewItem[]>
}

const sectionLinkClasses = 'inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2'

export default function OverviewGoalPreview({ state }: OverviewGoalPreviewProps) {
  const location = useLocation()
  const goals = state.data ?? []

  return (
    <section aria-labelledby="overview-goals-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-goals-heading"
        title="Active goals"
        description="A compact view of up to two current personal goals."
        actions={(
          <Link className={sectionLinkClasses} to={{ pathname: '/goals', search: location.search }}>
            View goals
          </Link>
        )}
      />
      {state.loading && state.data === null ? <LoadingState message="Loading active goals..." /> : null}
      {state.error && state.data === null ? (
        <Alert tone="error" title="Active goals unavailable">{state.error}</Alert>
      ) : null}
      {state.data !== null && goals.length === 0 ? (
        <EmptyState
          compact
          title="No active personal goals"
          description="Create a goal when you are ready to track a new target."
        />
      ) : null}
      {goals.length > 0 ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {goals.map(({ goal, progress, progressError }) => (
            <Card key={goal.id} as="article" padding="compact" className="min-w-0 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                  {GOAL_TYPE_LABELS[goal.goalType]}
                </p>
                <h3 className="mt-1 break-words text-base font-semibold text-app-primary">
                  {goal.title}
                </h3>
              </div>
              {progress === null ? (
                <Alert tone="information" title="Progress unavailable">
                  {progressError ?? 'Progress is currently unavailable.'}
                </Alert>
              ) : !progress.progressAvailable ? (
                <Alert tone="information" title="Progress unavailable">
                  {progress.message ?? 'Progress is currently unavailable.'}
                </Alert>
              ) : (
                <>
                  <p className="break-words text-sm font-semibold text-app-primary">
                    {progress.currentValue ?? 'Not available'} / {progress.targetValue} {progress.displayUnit}
                  </p>
                  <p className="text-sm text-app-secondary">{progress.points} points</p>
                  {progress.progressPercentage === null ? (
                    <p className="text-sm text-app-secondary">Percentage: Not available</p>
                  ) : (
                    <ProgressBar
                      value={progress.progressPercentage}
                      maximum={100}
                      label="Goal progress"
                      valueText={`${progress.progressPercentage.toFixed(2)}%`}
                    />
                  )}
                </>
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
