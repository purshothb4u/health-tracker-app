import type { HydrationSummary } from '../types/WaterTracking'
import { Card } from './ui/Card'
import { ProgressBar } from './ui/ProgressBar'

interface HydrationSummaryCardProps {
  summary: HydrationSummary
}

function formatWholeNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatWaterAmount(value: number | null): string {
  if (value === null) return 'Not available'
  return `${formatWholeNumber(value)} ml`
}

function formatPercentage(value: number | null): string {
  return value === null ? 'Not available' : `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

export default function HydrationSummaryCard({ summary }: HydrationSummaryCardProps) {
  const percentage = summary.progressAgainstCurrentGoalPercentage

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      aria-label="Hydration progress"
      className="min-w-0 border-metric-hydration/25 bg-metric-hydration-surface/45"
    >
      <div className="min-w-0 space-y-2">
        <p className="break-words text-metric-value tabular-nums text-app-primary">
          {formatWaterAmount(summary.totalConsumedMl)} consumed
        </p>
        <p className="break-words text-card-title tabular-nums text-app-secondary">
          {summary.remainingAgainstCurrentGoalMl === null
            ? 'Amount left not available'
            : `${formatWaterAmount(summary.remainingAgainstCurrentGoalMl)} left`}
        </p>
      </div>

      {percentage === null ? (
        <p className="mt-5 text-supporting text-app-secondary">Progress not available.</p>
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
    </Card>
  )
}
