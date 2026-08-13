import type { DailyTargets } from '../types/DailyTargets'
import type { DailyNutritionSummary } from '../types/FoodEntry'
import type { ActivityLevel, ProfileGoalType } from '../types/UserProfile'
import { formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface DailyNutritionSummaryCardProps {
  entryCount: number
  summary: DailyNutritionSummary
  dailyTargets: DailyTargets | null
  dailyTargetsLoading: boolean
}

interface TargetMetricProps {
  consumed: number
  hasFoodEntries: boolean
  label: string
  target: number | null
  unit: 'g' | 'kcal'
}

const activityLabels: Record<ActivityLevel, string> = {
  SEDENTARY: 'Sedentary',
  LIGHTLY_ACTIVE: 'Lightly active',
  MODERATELY_ACTIVE: 'Moderately active',
  VERY_ACTIVE: 'Very active',
}

const goalLabels: Record<ProfileGoalType, string> = {
  LOSE_WEIGHT: 'Lose weight',
  MAINTAIN_WEIGHT: 'Maintain weight',
  GAIN_WEIGHT: 'Gain weight',
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatAmount(value: number, unit: TargetMetricProps['unit']): string {
  return `${formatNumber(value)} ${unit}`
}

function TargetMetric({
  consumed,
  hasFoodEntries,
  label,
  target,
  unit,
}: TargetMetricProps) {
  let differenceText: string | null = null
  if (hasFoodEntries && target !== null) {
    const difference = target - consumed
    differenceText = difference >= 0
      ? `${formatAmount(difference, unit)} remaining`
      : `${formatAmount(Math.abs(difference), unit)} over target`
  }

  return (
    <div className="min-w-0 rounded-card border border-app-border-muted bg-app-surface p-4">
      <dt className="break-words text-metadata font-semibold text-app-secondary">{label}</dt>
      <dd className="mt-2 min-w-0">
        <p className="break-words text-lg font-bold leading-snug tabular-nums text-app-primary">
          {hasFoodEntries ? formatAmount(consumed, unit) : 'Not logged'}
          <span className="font-medium text-app-secondary"> / </span>
          {target === null ? 'Not available' : `${formatAmount(target, unit)} estimated target`}
        </p>
        {differenceText !== null ? (
          <p className="mt-1 break-words text-supporting text-app-secondary">{differenceText}</p>
        ) : null}
      </dd>
    </div>
  )
}

export default function DailyNutritionSummaryCard({
  entryCount,
  summary,
  dailyTargets,
  dailyTargetsLoading,
}: DailyNutritionSummaryCardProps) {
  const headingId = `nutrition-summary-heading-${summary.userProfileId}`
  const hasFoodEntries = entryCount > 0
  const targetsUnavailable = dailyTargets !== null && !dailyTargets.calorieTargetsAvailable

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
          description={`Food totals for ${formatLocalDate(summary.entryDate)} with current estimated daily targets.`}
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
          No intake is assumed. Estimated targets are shown only as current profile references.
        </Alert>
      ) : null}

      <div className="mt-5 min-w-0 rounded-card border border-metric-nutrition/25 bg-app-surface/80 p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="break-words text-base font-bold text-app-primary">Estimated daily targets</h4>
            <p className="mt-1 break-words text-supporting text-app-secondary">
              Based on your current profile, activity level and goal. These are estimates, not medical prescriptions.
            </p>
          </div>
          {dailyTargets !== null ? (
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="information">
                {activityLabels[dailyTargets.activityLevel]}
              </StatusBadge>
              {dailyTargets.goalType !== null ? (
                <StatusBadge tone="neutral">{goalLabels[dailyTargets.goalType]}</StatusBadge>
              ) : null}
            </div>
          ) : null}
        </div>
        {dailyTargetsLoading ? (
          <LoadingState className="mt-3" compact message="Loading estimated daily targets..." />
        ) : null}
        {targetsUnavailable ? (
          <Alert className="mt-3" tone="information" title="Estimated nutrition targets unavailable">
            {dailyTargets.calorieTargetsUnavailableReason
              ?? 'Estimated calorie and macronutrient targets are not available.'}
          </Alert>
        ) : null}
      </div>

      <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
        <TargetMetric
          consumed={summary.totalCalories}
          hasFoodEntries={hasFoodEntries}
          label="Calories"
          target={dailyTargets?.estimatedCalorieTargetKcal ?? null}
          unit="kcal"
        />
        <TargetMetric
          consumed={summary.totalProteinGrams}
          hasFoodEntries={hasFoodEntries}
          label="Protein"
          target={dailyTargets?.proteinTargetG ?? null}
          unit="g"
        />
        <TargetMetric
          consumed={summary.totalCarbohydrateGrams}
          hasFoodEntries={hasFoodEntries}
          label="Carbohydrates"
          target={dailyTargets?.carbohydrateTargetG ?? null}
          unit="g"
        />
        <TargetMetric
          consumed={summary.totalFatGrams}
          hasFoodEntries={hasFoodEntries}
          label="Fat"
          target={dailyTargets?.fatTargetG ?? null}
          unit="g"
        />
      </dl>
    </Card>
  )
}
