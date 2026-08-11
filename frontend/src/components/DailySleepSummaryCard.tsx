import type { DailySleepSummary } from '../types/SleepTracking'
import { formatDurationMinutes, formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface DailySleepSummaryCardProps {
  summary: DailySleepSummary
}

function formatAverageQuality(averageQuality: number | null): string {
  return averageQuality === null
    ? 'Not available'
    : `${averageQuality.toLocaleString(undefined, { maximumFractionDigits: 2 })} / 5`
}

function SummaryMetric({
  label,
  value,
  prominent = false,
}: {
  label: string
  value: string
  prominent?: boolean
}) {
  return (
    <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface px-4 py-3">
      <dt className="break-words text-metadata font-medium text-app-secondary">{label}</dt>
      <dd className={prominent
        ? 'mt-1 break-words text-xl font-bold tabular-nums text-app-primary'
        : 'mt-1 break-words text-base font-bold tabular-nums text-app-primary'}>
        {value}
      </dd>
    </div>
  )
}

export default function DailySleepSummaryCard({ summary }: DailySleepSummaryCardProps) {
  const headingId = `sleep-summary-heading-${summary.userProfileId}`

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      aria-labelledby={headingId}
      className="min-w-0 border-metric-sleep/25 bg-metric-sleep-surface/50"
    >
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="sleep" size="large">
          <TrackingIcon name="sleep" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId={headingId}
          headingLevel={3}
          title="Daily sleep summary"
          description={`Backend-calculated totals for sessions ending on ${formatLocalDate(summary.sleepDate)}.`}
          actions={(
            <StatusBadge tone="sleep">
              {summary.sessionCount === 0
                ? 'No sleep logged'
                : `${summary.sessionCount.toLocaleString()} ${summary.sessionCount === 1 ? 'session' : 'sessions'}`}
            </StatusBadge>
          )}
        />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="min-w-0 rounded-card border border-metric-sleep/25 bg-app-surface p-4">
          <p className="text-metadata font-semibold text-app-secondary">Total sleep</p>
          <p className="mt-2 break-words text-metric-value tabular-nums text-app-primary">
            {formatDurationMinutes(summary.totalSleepMinutes)}
          </p>
          <p className="mt-3 break-words text-metadata text-app-secondary">
            Total of every recorded session ending on this date, including Other sessions.
          </p>
        </div>

        <div className="min-w-0">
          <dl className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
            <SummaryMetric label="Night sleep" value={formatDurationMinutes(summary.nightSleepMinutes)} prominent />
            <SummaryMetric label="Nap duration" value={formatDurationMinutes(summary.napMinutes)} prominent />
            <SummaryMetric label="Session count" value={summary.sessionCount.toLocaleString()} />
            <SummaryMetric label="Average quality" value={formatAverageQuality(summary.averageQuality)} />
          </dl>
          <p className="mt-3 break-words text-metadata text-app-secondary">
            Average quality includes rated sessions only; unrated sessions are excluded.
          </p>
        </div>
      </div>
    </Card>
  )
}
