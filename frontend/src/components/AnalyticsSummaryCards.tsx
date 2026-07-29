import type { NutritionAnalytics, WeightAnalytics } from '../types/Analytics'
import { formatAnalyticsNumber, formatAnalyticsValue } from '../utils/analyticsFormatting'

interface AnalyticsSummaryCardsProps {
  weightAnalytics: WeightAnalytics
  nutritionAnalytics: NutritionAnalytics
}

interface SummaryCardProps {
  label: string
  value: string
  detail?: string
}

function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-gray-900">{value}</dd>
      {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
    </div>
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
    <section aria-labelledby="analytics-summary-heading">
      <div className="mb-3">
        <h4 id="analytics-summary-heading" className="text-base font-semibold text-gray-900">
          Selected-range summary
        </h4>
        <p className="mt-1 text-sm text-gray-500">Values reflect recorded data in the selected range.</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Last weight in range"
          value={formatAnalyticsValue(weightAnalytics.lastWeightKgInRange, ' kg')}
        />
        <SummaryCard label="Weight change" value={formatWeightChange(weightAnalytics.weightChangeKg)} />
        <SummaryCard
          label="Average weight"
          value={formatAnalyticsValue(weightAnalytics.averageWeightKg, ' kg')}
        />
        <SummaryCard
          label="Progress at end of range"
          value={formatAnalyticsValue(weightAnalytics.progressAtEndOfRangePercentage, '%')}
        />
        <SummaryCard
          label="Average calories"
          value={formatAnalyticsValue(nutritionAnalytics.averageCaloriesPerLoggedDay, ' kcal')}
          detail="Per logged day"
        />
        <SummaryCard
          label="Average protein"
          value={formatAnalyticsValue(nutritionAnalytics.averageProteinGramsPerLoggedDay, ' g')}
          detail="Per logged day"
        />
        <SummaryCard
          label="Days with food logs"
          value={String(nutritionAnalytics.daysWithFoodLogs)}
          detail={`${nutritionAnalytics.totalDaysInRange} days in range`}
        />
        <SummaryCard
          label="Logged days below maintenance"
          value={
            nutritionAnalytics.daysBelowMaintenance === null
              ? 'Not available'
              : String(nutritionAnalytics.daysBelowMaintenance)
          }
        />
      </dl>
    </section>
  )
}
