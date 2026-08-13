import type { DailyTargets } from '../types/DailyTargets'
import type { HydrationSummary } from '../types/WaterTracking'
import { formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { ProgressBar } from './ui/ProgressBar'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface HydrationSummaryCardProps {
  summary: HydrationSummary
  dailyTargets: DailyTargets | null
  dailyTargetsLoading: boolean
}

function formatWholeNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatWaterAmount(value: number | null): string {
  if (value === null) return 'Not available'
  const millilitres = `${formatWholeNumber(value)} ml`
  if (value < 1000) return millilitres
  const litres = (value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })
  return `${millilitres} (${litres} L)`
}

function formatPercentage(value: number | null): string {
  return value === null ? 'Not available' : `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

function SupportingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface px-4 py-3">
      <dt className="break-words text-metadata font-medium text-app-secondary">{label}</dt>
      <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">{value}</dd>
    </div>
  )
}

export default function HydrationSummaryCard({
  summary,
  dailyTargets,
  dailyTargetsLoading,
}: HydrationSummaryCardProps) {
  const percentage = summary.progressAgainstCurrentGoalPercentage
  const goalStatus = summary.goalReached === null
    ? <StatusBadge tone="warning">Goal not configured</StatusBadge>
    : summary.goalReached
      ? <StatusBadge tone="success">Goal reached</StatusBadge>
      : <StatusBadge tone="information">In progress</StatusBadge>

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      aria-labelledby="hydration-summary-heading"
      className="min-w-0 border-metric-hydration/25 bg-metric-hydration-surface/45"
    >
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="hydration" size="large">
          <TrackingIcon name="hydration" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId="hydration-summary-heading"
          headingLevel={3}
          title="Hydration summary"
          description={`Backend-calculated totals for ${formatLocalDate(summary.entryDate)}.`}
          actions={(
            <div className="flex flex-wrap justify-end gap-2">
              <StatusBadge tone="hydration">
                {summary.entryCount === 0
                  ? 'No water logged'
                  : `${formatWholeNumber(summary.entryCount)} ${summary.entryCount === 1 ? 'entry' : 'entries'}`}
              </StatusBadge>
              {goalStatus}
            </div>
          )}
        />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start">
        <div className="min-w-0 rounded-card border border-metric-hydration/25 bg-app-surface p-4">
          <p className="text-metadata font-semibold text-app-secondary">Total consumed</p>
          <p className="mt-2 break-words text-metric-value tabular-nums text-app-primary">
            {formatWaterAmount(summary.totalConsumedMl)}
          </p>

          {percentage === null ? (
            <Alert className="mt-5" tone="information" title="Configure a daily water goal">
              Hydration progress is not available until a goal is saved below.
            </Alert>
          ) : (
            <ProgressBar
              className="mt-5"
              label="Hydration progress against current goal"
              maximum={100}
              value={percentage}
              valueText={`${formatPercentage(percentage)} of current goal`}
              tone="hydration"
            />
          )}
        </div>

        <dl className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
          <SupportingMetric
            label="Configured tracking goal"
            value={formatWaterAmount(summary.currentDailyGoalMl)}
          />
          <SupportingMetric
            label="Estimated fluid reference"
            value={dailyTargetsLoading && dailyTargets === null
              ? 'Loading...'
              : formatWaterAmount(dailyTargets?.estimatedHydrationMl ?? null)}
          />
          <SupportingMetric label="Remaining" value={formatWaterAmount(summary.remainingAgainstCurrentGoalMl)} />
          <SupportingMetric label="Excess" value={formatWaterAmount(summary.excessAgainstCurrentGoalMl)} />
          <SupportingMetric label="Entries" value={formatWholeNumber(summary.entryCount)} />
        </dl>
      </div>

      <div className="mt-4 rounded-control border border-app-border-muted bg-app-surface/80 px-4 py-3">
        <p className="break-words text-supporting text-app-secondary">
          The estimated fluid reference is separate from your configured tracking goal and does not replace it.
        </p>
        {dailyTargets !== null && !dailyTargets.hydrationEstimateAvailable ? (
          <p className="mt-2 break-words text-supporting font-medium text-app-primary">
            {dailyTargets.hydrationEstimateUnavailableReason
              ?? 'The estimated fluid reference is not available.'}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
