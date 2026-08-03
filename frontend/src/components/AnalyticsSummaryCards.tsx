import type { NutritionAnalytics, WeightAnalytics } from '../types/Analytics'
import { formatAnalyticsNumber, formatAnalyticsValue } from '../utils/analyticsFormatting'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

interface AnalyticsSummaryCardsProps {
  weightAnalytics: WeightAnalytics
  nutritionAnalytics: NutritionAnalytics
}

interface AnalyticsSummaryCardProps {
  label: string
  value: string
  detail?: string
}

function AnalyticsSummaryCard({ label, value, detail }: AnalyticsSummaryCardProps) {
  return (
    <Card padding="compact" className="min-w-0">
      <dt className="break-words text-sm font-medium text-app-secondary">{label}</dt>
      <dd className="mt-2 break-words text-xl font-semibold tabular-nums text-app-primary">{value}</dd>
      {detail ? <p className="mt-1 break-words text-xs leading-5 text-app-secondary">{detail}</p> : null}
    </Card>
  )
}

function formatWeightChange(value: number | null): string {
  if (value === null) {
    return 'Not available'
  }
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatAnalyticsNumber(value)} kg`
}

export default function AnalyticsSummaryCards({
  weightAnalytics,
  nutritionAnalytics,
}: AnalyticsSummaryCardsProps) {
  return (
    <section className="min-w-0 space-y-4" aria-labelledby="analytics-summary-heading">
      <SectionHeader
        headingId="analytics-summary-heading"
        headingLevel={3}
        title="Selected-range summary"
        description="Values reflect recorded data in the selected date range."
      />
      <dl className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsSummaryCard
          label="Last weight in range"
          value={formatAnalyticsValue(weightAnalytics.lastWeightKgInRange, ' kg')}
        />
        <AnalyticsSummaryCard label="Weight change" value={formatWeightChange(weightAnalytics.weightChangeKg)} />
        <AnalyticsSummaryCard
          label="Average weight"
          value={formatAnalyticsValue(weightAnalytics.averageWeightKg, ' kg')}
        />
        <AnalyticsSummaryCard
          label="Progress at end of range"
          value={formatAnalyticsValue(weightAnalytics.progressAtEndOfRangePercentage, '%')}
        />
        <AnalyticsSummaryCard
          label="Average calories"
          value={formatAnalyticsValue(nutritionAnalytics.averageCaloriesPerLoggedDay, ' kcal')}
          detail="Per logged day"
        />
        <AnalyticsSummaryCard
          label="Average protein"
          value={formatAnalyticsValue(nutritionAnalytics.averageProteinGramsPerLoggedDay, ' g')}
          detail="Per logged day"
        />
        <AnalyticsSummaryCard
          label="Days with food logs"
          value={String(nutritionAnalytics.daysWithFoodLogs)}
          detail={`${nutritionAnalytics.totalDaysInRange} days in range`}
        />
        <AnalyticsSummaryCard
          label="Logged days below maintenance"
          value={nutritionAnalytics.daysBelowMaintenance === null
            ? 'Not available'
            : String(nutritionAnalytics.daysBelowMaintenance)}
        />
      </dl>
    </section>
  )
}
