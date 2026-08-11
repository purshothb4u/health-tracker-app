import type { NutritionAnalytics, WeightAnalytics } from '../types/Analytics'
import { formatAnalyticsNumber, formatAnalyticsValue } from '../utils/analyticsFormatting'
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'

interface AnalyticsSummaryCardsProps {
  weightAnalytics: WeightAnalytics
  nutritionAnalytics: NutritionAnalytics
}

interface SummaryMetricProps {
  label: string
  value: string
  detail?: string
  featured?: boolean
}

function SummaryMetric({ label, value, detail, featured = false }: SummaryMetricProps) {
  return (
    <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface/85 p-3 sm:p-4">
      <dt className="break-words text-label text-app-secondary">{label}</dt>
      <dd
        className={featured
          ? 'mt-2 break-words text-metric-value tabular-nums text-app-primary'
          : 'mt-2 break-words text-card-title tabular-nums text-app-primary'}
      >
        {value}
        {detail ? (
          <span className="mt-1 block break-words text-metadata font-normal text-app-secondary">
            {detail}
          </span>
        ) : null}
      </dd>
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
    <section className="min-w-0 space-y-4" aria-labelledby="analytics-summary-heading">
      <SectionHeader
        headingId="analytics-summary-heading"
        headingLevel={3}
        title="Selected-range summary"
        description="Recorded values remain neutral; missing data is shown as Not available."
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card
          as="section"
          padding="normal"
          elevated
          className="min-w-0 border-primary-100 bg-primary-50/45"
          aria-labelledby="weight-summary-heading"
        >
          <div className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="primary">
              <TrackingIcon name="weight" />
            </IconContainer>
            <div className="min-w-0">
              <h4 id="weight-summary-heading" className="break-words text-card-title text-app-primary">
                Weight
              </h4>
              <p className="mt-0.5 break-words text-metadata text-app-secondary">
                Selected-range records only
              </p>
            </div>
          </div>
          <dl className="mt-4 grid min-w-0 gap-3 min-[430px]:grid-cols-2">
            <SummaryMetric
              featured
              label="Last weight in range"
              value={formatAnalyticsValue(weightAnalytics.lastWeightKgInRange, ' kg')}
            />
            <SummaryMetric label="Weight change" value={formatWeightChange(weightAnalytics.weightChangeKg)} />
            <SummaryMetric
              label="Average weight"
              value={formatAnalyticsValue(weightAnalytics.averageWeightKg, ' kg')}
            />
            <SummaryMetric
              label="Progress at end of range"
              value={formatAnalyticsValue(weightAnalytics.progressAtEndOfRangePercentage, '%')}
            />
          </dl>
        </Card>

        <Card
          as="section"
          padding="normal"
          elevated
          className="min-w-0 border-metric-nutrition/25 bg-metric-nutrition-surface/45"
          aria-labelledby="nutrition-summary-heading"
        >
          <div className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="nutrition">
              <TrackingIcon name="nutrition" />
            </IconContainer>
            <div className="min-w-0">
              <h4 id="nutrition-summary-heading" className="break-words text-card-title text-app-primary">
                Nutrition
              </h4>
              <p className="mt-0.5 break-words text-metadata text-app-secondary">
                Averages use logged days only
              </p>
            </div>
          </div>
          <dl className="mt-4 grid min-w-0 gap-3 min-[430px]:grid-cols-2">
            <SummaryMetric
              featured
              label="Average calories"
              value={formatAnalyticsValue(nutritionAnalytics.averageCaloriesPerLoggedDay, ' kcal')}
              detail="Per logged day"
            />
            <SummaryMetric
              label="Average protein"
              value={formatAnalyticsValue(nutritionAnalytics.averageProteinGramsPerLoggedDay, ' g')}
              detail="Per logged day"
            />
            <SummaryMetric
              label="Days with food logs"
              value={String(nutritionAnalytics.daysWithFoodLogs)}
              detail={`${nutritionAnalytics.totalDaysInRange} days in range`}
            />
            <SummaryMetric
              label="Logged days below maintenance"
              value={nutritionAnalytics.daysBelowMaintenance === null
                ? 'Not available'
                : String(nutritionAnalytics.daysBelowMaintenance)}
              detail={nutritionAnalytics.daysBelowMaintenance === null
                ? 'Current maintenance estimate unavailable'
                : 'Unlogged days are excluded'}
            />
          </dl>
        </Card>
      </div>
    </section>
  )
}
