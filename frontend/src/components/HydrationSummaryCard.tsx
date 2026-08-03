import type { HydrationSummary } from '../types/WaterTracking'
import { formatLocalDate } from '../utils/dateFormatting'
import { Alert } from './ui/Alert'
import { Card } from './ui/Card'
import { ProgressBar } from './ui/ProgressBar'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface HydrationSummaryCardProps {
  summary: HydrationSummary
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

export default function HydrationSummaryCard({ summary }: HydrationSummaryCardProps) {
  const percentage = summary.progressAgainstCurrentGoalPercentage
  const goalStatus = summary.goalReached === null
    ? <StatusBadge tone="warning">Goal not configured</StatusBadge>
    : summary.goalReached
      ? <StatusBadge tone="success">Goal reached</StatusBadge>
      : <StatusBadge tone="information">In progress</StatusBadge>

  return (
    <Card as="section" padding="normal" aria-labelledby="hydration-summary-heading">
      <SectionHeader
        headingId="hydration-summary-heading"
        headingLevel={3}
        title="Hydration summary"
        description={`Backend-calculated totals for ${formatLocalDate(summary.entryDate)}.`}
        actions={goalStatus}
      />

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        {[
          ['Total consumed', formatWaterAmount(summary.totalConsumedMl)],
          ['Current daily goal', formatWaterAmount(summary.currentDailyGoalMl)],
          ['Remaining', formatWaterAmount(summary.remainingAgainstCurrentGoalMl)],
          ['Excess', formatWaterAmount(summary.excessAgainstCurrentGoalMl)],
          ['Progress', formatPercentage(percentage)],
          ['Entries', formatWholeNumber(summary.entryCount)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4">
            <dt className="text-app-secondary">{label}</dt>
            <dd className="mt-1 break-words text-lg font-bold text-app-primary">{value}</dd>
          </div>
        ))}
      </dl>

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
        />
      )}
    </Card>
  )
}
