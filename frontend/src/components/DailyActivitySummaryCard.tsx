import type { DailyActivitySummary } from '../types/ActivityTracking'
import { classNames } from '../utils/classNames'
import { formatDurationMinutes, formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface DailyActivitySummaryCardProps {
  summary: DailyActivitySummary
}

function formatSteps(steps: number | null): string {
  return steps === null ? 'Not available' : `${steps.toLocaleString()} steps`
}

function formatDistance(distanceKm: number | null): string {
  return distanceKm === null
    ? 'Not available'
    : `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 3 })} km`
}

function formatReportedCalories(calories: number | null): string {
  return calories === null ? 'Not available' : `${calories.toLocaleString()} kcal reported`
}

function SupportingMetric({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={classNames(
      'min-w-0 rounded-control border border-app-border-muted bg-app-surface px-4 py-3',
      className,
    )}>
      <dt className="break-words text-metadata font-medium text-app-secondary">{label}</dt>
      <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">{value}</dd>
    </div>
  )
}

export default function DailyActivitySummaryCard({ summary }: DailyActivitySummaryCardProps) {
  const headingId = `activity-summary-heading-${summary.userProfileId}`

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      aria-labelledby={headingId}
      className="min-w-0 border-metric-activity/25 bg-metric-activity-surface/45"
    >
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="activity" size="large">
          <TrackingIcon name="activity" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId={headingId}
          headingLevel={3}
          title="Daily activity summary"
          description={`Backend-calculated totals for ${formatLocalDate(summary.activityDate)}.`}
          actions={(
            <StatusBadge tone="activity">
              {summary.activityCount === 0
                ? 'No activity logged'
                : `${summary.activityCount.toLocaleString()} ${summary.activityCount === 1 ? 'activity' : 'activities'}`}
            </StatusBadge>
          )}
        />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-start">
        <dl className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
          <div className="min-w-0 rounded-card border border-metric-activity/25 bg-app-surface p-4">
            <dt className="text-metadata font-semibold text-app-secondary">Activity count</dt>
            <dd className="mt-2 break-words text-metric-value tabular-nums text-app-primary">
              {summary.activityCount.toLocaleString()}
            </dd>
          </div>
          <div className="min-w-0 rounded-card border border-metric-activity/25 bg-app-surface p-4">
            <dt className="text-metadata font-semibold text-app-secondary">Total duration</dt>
            <dd className="mt-2 break-words text-metric-value tabular-nums text-app-primary">
              {formatDurationMinutes(summary.totalDurationMinutes)}
            </dd>
          </div>
        </dl>

        <div className="min-w-0">
          <dl className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
            <SupportingMetric label="Reported steps" value={formatSteps(summary.reportedSteps)} />
            <SupportingMetric label="Reported distance" value={formatDistance(summary.reportedDistanceKm)} />
            <SupportingMetric
              className="min-[390px]:col-span-2"
              label="Reported calories burned"
              value={formatReportedCalories(summary.reportedCaloriesBurned)}
            />
          </dl>
          <p className="mt-3 break-words text-metadata text-app-secondary">
            Steps, distance, and calories are user-reported values; missing values are not estimated.
          </p>
        </div>
      </div>
    </Card>
  )
}
