import { useId } from 'react'
import type { HealthSummary } from '../types/HealthMetric'
import { formatLocalDate } from '../utils/dateFormatting'
import { Card } from './ui/Card'
import { ProgressBar } from './ui/ProgressBar'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface HealthSummaryCardProps {
  summary: HealthSummary
}

function formatCalories(value: number | null): string {
  return value === null ? 'Not available' : `${value.toLocaleString()} kcal`
}

export default function HealthSummaryCard({ summary }: HealthSummaryCardProps) {
  const headingId = useId()
  const progressText = `${summary.goalProgressPercent.toFixed(1)}%`

  return (
    <Card
      as="section"
      padding="normal"
      aria-labelledby={headingId}
      className="border-primary-100 bg-primary-50/60"
    >
      <SectionHeader
        headingId={headingId}
        headingLevel={3}
        title="Health summary"
        description={summary.latestMetricDate
          ? `Latest recorded weight from ${formatLocalDate(summary.latestMetricDate)}.`
          : 'Based on the latest recorded weight.'}
        actions={<StatusBadge tone="success">{progressText} of goal</StatusBadge>}
      />

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0 rounded-xl border border-primary-100 bg-app-surface p-3">
          <dt className="text-app-secondary">Latest weight</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {summary.latestWeightKg} kg
          </dd>
        </div>
        <div className="min-w-0 rounded-xl border border-primary-100 bg-app-surface p-3">
          <dt className="text-app-secondary">BMI</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {summary.bmi.toFixed(2)}
          </dd>
        </div>
        <div className="min-w-0 rounded-xl border border-primary-100 bg-app-surface p-3">
          <dt className="text-app-secondary">BMR</dt>
          <dd className="mt-1 break-words font-semibold text-app-primary">
            {formatCalories(summary.bmrCaloriesPerDay)}
          </dd>
        </div>
        <div className="min-w-0 rounded-xl border border-primary-100 bg-app-surface p-3">
          <dt className="text-app-secondary">Maintenance</dt>
          <dd className="mt-1 break-words font-semibold text-app-primary">
            {formatCalories(summary.maintenanceCaloriesPerDay)}
          </dd>
        </div>
      </dl>

      <ProgressBar
        className="mt-5"
        label="Weight goal progress"
        maximum={100}
        value={summary.goalProgressPercent}
        valueText={progressText}
      />

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0 rounded-lg border border-primary-100 bg-app-surface px-3 py-2.5">
          <dt className="text-app-secondary">Lost so far</dt>
          <dd className="break-words font-semibold text-app-primary">{summary.weightLostKg} kg</dd>
        </div>
        <div className="min-w-0 rounded-lg border border-primary-100 bg-app-surface px-3 py-2.5">
          <dt className="text-app-secondary">Remaining</dt>
          <dd className="break-words font-semibold text-app-primary">
            {summary.weightRemainingKg} kg
          </dd>
        </div>
      </dl>
    </Card>
  )
}
