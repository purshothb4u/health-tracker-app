import type { DailyNutritionSummary } from '../types/FoodEntry'
import { formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface DailyNutritionSummaryCardProps {
  entryCount: number
  summary: DailyNutritionSummary
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
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

export default function DailyNutritionSummaryCard({
  entryCount,
  summary,
}: DailyNutritionSummaryCardProps) {
  const headingId = `nutrition-summary-heading-${summary.userProfileId}`

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      aria-labelledby={headingId}
      className="min-w-0 border-metric-nutrition/25 bg-metric-nutrition-surface/45"
    >
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="nutrition" size="large">
          <TrackingIcon name="nutrition" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId={headingId}
          headingLevel={3}
          title="Daily nutrition summary"
          description={`Backend-calculated totals for ${formatLocalDate(summary.entryDate)}.`}
          actions={(
            <StatusBadge tone="nutrition">
              {entryCount === 0
                ? 'No food logged'
                : `${entryCount.toLocaleString()} ${entryCount === 1 ? 'entry' : 'entries'}`}
            </StatusBadge>
          )}
        />
      </div>

      {entryCount === 0 ? (
        <Alert className="mt-5" tone="information" title="No food logged for this date">
          Summary totals are zero because there are no entries. Zero intake is not assumed.
        </Alert>
      ) : null}

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <dl className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
          <div className="min-w-0 rounded-card border border-metric-nutrition/25 bg-app-surface p-4">
            <dt className="text-metadata font-semibold text-app-secondary">Total calories</dt>
            <dd className="mt-2 break-words text-metric-value tabular-nums text-app-primary">
              {formatNumber(summary.totalCalories)} kcal
            </dd>
          </div>
          <div className="min-w-0 rounded-card border border-app-border-muted bg-app-surface p-4">
            <dt className="text-metadata font-semibold text-app-secondary">Remaining calories</dt>
            <dd className="mt-2 break-words text-metric-value tabular-nums text-app-primary">
              {formatCalories(summary.remainingCalories)}
            </dd>
          </div>
        </dl>

        <dl className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
          <SupportingMetric label="Maintenance calories" value={formatCalories(summary.maintenanceCalories)} />
          <SupportingMetric label="Protein" value={`${formatNumber(summary.totalProteinGrams)} g`} />
          <SupportingMetric
            label="Carbohydrates"
            value={`${formatNumber(summary.totalCarbohydrateGrams)} g`}
          />
          <SupportingMetric label="Fat" value={`${formatNumber(summary.totalFatGrams)} g`} />
        </dl>
      </div>
    </Card>
  )
}
