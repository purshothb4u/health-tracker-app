import type { ReactNode } from 'react'
import type { UserProfile } from '../../types/UserProfile'
import type {
  OverviewNutritionData,
  OverviewSectionState,
  UseOverviewDataResult,
} from '../../hooks/useOverviewData'
import type { HealthSummary } from '../../types/HealthMetric'
import type { HydrationSummary } from '../../types/WaterTracking'
import type { DailyActivitySummary } from '../../types/ActivityTracking'
import type { DailySleepSummary } from '../../types/SleepTracking'
import { formatDurationMinutes, formatLocalDate } from '../../utils/dateFormatting'
import { Alert } from '../ui/Alert'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'
import { ProgressBar } from '../ui/ProgressBar'
import { SectionHeader } from '../ui/SectionHeader'

interface OverviewStatusCardsProps {
  profile: UserProfile
  today: string
  health: UseOverviewDataResult['health']
  nutrition: UseOverviewDataResult['nutrition']
  hydration: UseOverviewDataResult['hydration']
  activity: UseOverviewDataResult['activity']
  sleep: UseOverviewDataResult['sleep']
}

interface StatusCardProps<T> {
  title: string
  state: OverviewSectionState<T>
  children: (data: T) => ReactNode
}

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

function percentageText(value: number): string {
  return `${value.toFixed(2)}%`
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-app-primary">{value}</dd>
    </div>
  )
}

function StatusCard<T>({ title, state, children }: StatusCardProps<T>) {
  return (
    <Card as="article" padding="compact" className="min-w-0">
      <h3 className="text-base font-semibold text-app-primary">{title}</h3>
      {state.loading && state.data === null ? (
        <LoadingState className="mt-3" compact message={`Loading ${title.toLowerCase()}...`} />
      ) : null}
      {state.error && state.data === null ? (
        <Alert className="mt-3" tone="error" title={`${title} unavailable`}>
          {state.error}
        </Alert>
      ) : null}
      {state.data !== null ? (
        <div className="mt-3 space-y-3">
          {children(state.data)}
          {state.loading ? (
            <LoadingState compact message={`Refreshing ${title.toLowerCase()}...`} />
          ) : null}
          {state.error ? (
            <Alert tone="warning" title="Showing previously loaded data">
              {state.error}
            </Alert>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

function HealthCardContent({ data, profile }: { data: HealthSummary; profile: UserProfile }) {
  const progressText = percentageText(data.goalProgressPercent)
  return (
    <>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-app-primary">
          {formatNumber(data.latestWeightKg)} kg
        </p>
        <p className="mt-1 text-sm text-app-secondary">
          {data.latestMetricDate === null
            ? 'No weight logged yet; showing profile weight.'
            : `Latest entry ${formatLocalDate(data.latestMetricDate)}`}
        </p>
      </div>
      <ProgressBar
        value={data.goalProgressPercent}
        maximum={100}
        label={`Target ${formatNumber(profile.targetWeightKg)} kg`}
        valueText={progressText}
      />
    </>
  )
}

function NutritionCardContent({ data }: { data: OverviewNutritionData }) {
  if (data.foodEntryCount === 0) {
    return (
      <div>
        <p className="text-lg font-semibold text-app-primary">Not logged</p>
        <p className="mt-1 text-sm text-app-secondary">No food entries were recorded today.</p>
      </div>
    )
  }

  const { summary } = data
  return (
    <>
      <p className="text-2xl font-semibold tracking-tight text-app-primary">
        {formatNumber(summary.totalCalories)} kcal
      </p>
      <dl className="grid grid-cols-2 gap-3">
        <Detail label="Protein" value={`${formatNumber(summary.totalProteinGrams)} g`} />
        <Detail label="Carbohydrates" value={`${formatNumber(summary.totalCarbohydrateGrams)} g`} />
        <Detail label="Fat" value={`${formatNumber(summary.totalFatGrams)} g`} />
        <Detail
          label="Maintenance"
          value={summary.maintenanceCalories === null
            ? 'Not available'
            : `${formatNumber(summary.maintenanceCalories)} kcal`}
        />
      </dl>
    </>
  )
}

function HydrationCardContent({ data }: { data: HydrationSummary }) {
  if (data.entryCount === 0) {
    return (
      <div>
        <p className="text-lg font-semibold text-app-primary">Not logged</p>
        <p className="mt-1 text-sm text-app-secondary">No water entries were recorded today.</p>
      </div>
    )
  }

  const progressText = data.progressAgainstCurrentGoalPercentage === null
    ? null
    : percentageText(data.progressAgainstCurrentGoalPercentage)
  return (
    <>
      <p className="text-2xl font-semibold tracking-tight text-app-primary">
        {formatNumber(data.totalConsumedMl)} ml
      </p>
      {data.currentDailyGoalMl === null || data.progressAgainstCurrentGoalPercentage === null ? (
        <p className="text-sm text-app-secondary">Hydration goal: Not available</p>
      ) : (
        <ProgressBar
          value={data.progressAgainstCurrentGoalPercentage}
          maximum={100}
          label={`Goal ${formatNumber(data.currentDailyGoalMl)} ml`}
          valueText={progressText ?? 'Not available'}
        />
      )}
    </>
  )
}

function ActivityCardContent({ data }: { data: DailyActivitySummary }) {
  if (data.activityCount === 0) {
    return (
      <div>
        <p className="text-lg font-semibold text-app-primary">Not logged</p>
        <p className="mt-1 text-sm text-app-secondary">No activities were recorded today.</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-2xl font-semibold tracking-tight text-app-primary">
        {formatDurationMinutes(data.totalDurationMinutes)}
      </p>
      <dl className="grid grid-cols-2 gap-3">
        <Detail label="Activities" value={formatNumber(data.activityCount)} />
        <Detail
          label="Reported steps"
          value={data.reportedSteps === null ? 'Not available' : formatNumber(data.reportedSteps)}
        />
        <Detail
          label="Distance"
          value={data.reportedDistanceKm === null
            ? 'Not available'
            : `${formatNumber(data.reportedDistanceKm)} km`}
        />
        <Detail
          label="Reported calories"
          value={data.reportedCaloriesBurned === null
            ? 'Not available'
            : `${formatNumber(data.reportedCaloriesBurned)} kcal`}
        />
      </dl>
    </>
  )
}

function SleepCardContent({ data }: { data: DailySleepSummary }) {
  if (data.sessionCount === 0) {
    return (
      <div>
        <p className="text-lg font-semibold text-app-primary">Not logged</p>
        <p className="mt-1 text-sm text-app-secondary">No sleep sessions ended today.</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-2xl font-semibold tracking-tight text-app-primary">
        {formatDurationMinutes(data.totalSleepMinutes)}
      </p>
      <dl className="grid grid-cols-2 gap-3">
        <Detail label="Sessions" value={formatNumber(data.sessionCount)} />
        <Detail
          label="Average quality"
          value={data.averageQuality === null ? 'Not available' : `${formatNumber(data.averageQuality)} / 5`}
        />
        <Detail label="Night sleep" value={formatDurationMinutes(data.nightSleepMinutes)} />
        <Detail label="Naps" value={formatDurationMinutes(data.napMinutes)} />
      </dl>
    </>
  )
}

export default function OverviewStatusCards({
  profile,
  today,
  health,
  nutrition,
  hydration,
  activity,
  sleep,
}: OverviewStatusCardsProps) {
  return (
    <section aria-labelledby="today-status-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="today-status-heading"
        title="Today's status"
        description={`Daily summaries for ${formatLocalDate(today)}. Weight uses the latest available health summary.`}
      />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatusCard title="Health" state={health}>
          {(data) => <HealthCardContent data={data} profile={profile} />}
        </StatusCard>
        <StatusCard title="Nutrition" state={nutrition}>
          {(data) => <NutritionCardContent data={data} />}
        </StatusCard>
        <StatusCard title="Hydration" state={hydration}>
          {(data) => <HydrationCardContent data={data} />}
        </StatusCard>
        <StatusCard title="Activity" state={activity}>
          {(data) => <ActivityCardContent data={data} />}
        </StatusCard>
        <StatusCard title="Sleep" state={sleep}>
          {(data) => <SleepCardContent data={data} />}
        </StatusCard>
      </div>
    </section>
  )
}
