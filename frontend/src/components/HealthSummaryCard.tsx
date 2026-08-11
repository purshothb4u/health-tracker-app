import { useId } from 'react'
import type { HealthSummary } from '../types/HealthMetric'
import type { UserProfile } from '../types/UserProfile'
import { formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { ProgressBar } from './ui/ProgressBar'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface HealthSummaryCardProps {
  profile: UserProfile
  summary: HealthSummary
}

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

function formatCalories(value: number | null): string {
  return value === null ? 'Not available' : `${formatNumber(value)} kcal`
}

function SupportingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface px-4 py-3">
      <dt className="break-words text-metadata font-medium text-app-secondary">{label}</dt>
      <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">{value}</dd>
    </div>
  )
}

export default function HealthSummaryCard({ profile, summary }: HealthSummaryCardProps) {
  const headingId = useId()
  const progressText = `${summary.goalProgressPercent.toFixed(1)}%`

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      aria-labelledby={headingId}
      className="relative min-w-0 overflow-hidden border-primary-100 bg-primary-50/55"
    >
      <span
        aria-hidden="true"
        className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[24px] border-primary-100/55"
      />
      <div className="relative flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="primary" size="large">
          <TrackingIcon name="weight" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId={headingId}
          headingLevel={3}
          title="Current weight and goal"
          description={summary.latestMetricDate
            ? `Latest recorded weight from ${formatLocalDate(summary.latestMetricDate)}.`
            : 'No weight entry is logged yet; the current profile weight is shown.'}
          actions={<StatusBadge tone="neutral">{progressText} of goal</StatusBadge>}
        />
      </div>

      <div className="relative mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-start">
        <div className="min-w-0">
          <p className="break-words text-metric-value tabular-nums text-app-primary">
            {formatNumber(summary.latestWeightKg)} kg
          </p>
          <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
            <div className="min-w-0 rounded-control border border-primary-100 bg-app-surface px-4 py-3">
              <dt className="text-metadata font-medium text-app-secondary">Target weight</dt>
              <dd className="mt-1 break-words text-lg font-bold tabular-nums text-app-primary">
                {formatNumber(profile.targetWeightKg)} kg
              </dd>
            </div>
            <div className="min-w-0 rounded-control border border-primary-100 bg-app-surface px-4 py-3">
              <dt className="text-metadata font-medium text-app-secondary">Remaining to target</dt>
              <dd className="mt-1 break-words text-lg font-bold tabular-nums text-app-primary">
                {formatNumber(summary.weightRemainingKg)} kg
              </dd>
            </div>
          </dl>
          <ProgressBar
            className="mt-5"
            label="Weight goal progress"
            maximum={100}
            value={summary.goalProgressPercent}
            valueText={progressText}
            tone="primary"
          />
          <p className="mt-3 break-words text-metadata text-app-secondary">
            Weight lost from starting weight:{' '}
            <strong className="font-semibold tabular-nums text-app-primary">
              {formatNumber(summary.weightLostKg)} kg
            </strong>
          </p>
        </div>

        <dl className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
          <SupportingMetric label="BMI" value={formatNumber(summary.bmi)} />
          <SupportingMetric label="BMR per day" value={formatCalories(summary.bmrCaloriesPerDay)} />
          <SupportingMetric
            label="Maintenance per day"
            value={formatCalories(summary.maintenanceCaloriesPerDay)}
          />
        </dl>
      </div>
    </Card>
  )
}
