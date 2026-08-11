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
import { IconContainer, type IconContainerTone } from '../ui/IconContainer'
import { LoadingState } from '../ui/LoadingState'
import { ProgressBar, type ProgressBarTone } from '../ui/ProgressBar'
import { SectionHeader } from '../ui/SectionHeader'
import OverviewIcon, { type OverviewIconName } from './OverviewIcon'

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
  icon: OverviewIconName
  tone: IconContainerTone
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

function profileTone(profileName: string): IconContainerTone {
  if (profileName === 'Husband') return 'husband'
  if (profileName === 'Wife') return 'wife'
  return 'primary'
}

function profileProgressTone(profileName: string): ProgressBarTone {
  if (profileName === 'Husband') return 'husband'
  if (profileName === 'Wife') return 'wife'
  return 'primary'
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="break-words text-metadata font-medium text-app-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">{value}</dd>
    </div>
  )
}

function NotLogged({ countLabel }: { countLabel: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-app-primary">Not logged</p>
      <p className="mt-1 text-supporting text-app-secondary">0 {countLabel} recorded today.</p>
    </div>
  )
}

function StatusCard<T>({ title, icon, tone, state, children }: StatusCardProps<T>) {
  return (
    <Card as="article" padding="compact" className="h-full min-w-0">
      <div className="flex min-w-0 items-center gap-3">
        <IconContainer aria-hidden="true" tone={tone}>
          <OverviewIcon name={icon} />
        </IconContainer>
        <h3 className="min-w-0 break-words text-card-title text-app-primary">{title}</h3>
      </div>
      {state.loading && state.data === null ? (
        <LoadingState className="mt-4" compact message={`Loading ${title.toLowerCase()}...`} />
      ) : null}
      {state.error && state.data === null ? (
        <Alert className="mt-4" tone="error" title={`${title} unavailable`}>
          {state.error}
        </Alert>
      ) : null}
      {state.data !== null ? (
        <div className="mt-4 space-y-4">
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
    <div className="space-y-5">
      <div>
        <p className="break-words text-metric-value tabular-nums text-app-primary">
          {formatNumber(data.latestWeightKg)} kg
        </p>
        <p className="mt-2 break-words text-supporting text-app-secondary">
          {data.latestMetricDate === null
            ? 'No weight entry is logged yet; showing the current profile weight.'
            : `Latest entry ${formatLocalDate(data.latestMetricDate)}`}
        </p>
      </div>
      <dl className="grid min-w-0 grid-cols-2 gap-4">
        <Detail label="Target weight" value={`${formatNumber(profile.targetWeightKg)} kg`} />
        <Detail label="Remaining to target" value={`${formatNumber(data.weightRemainingKg)} kg`} />
        <Detail label="BMI" value={formatNumber(data.bmi)} />
        <Detail label="Weight lost" value={`${formatNumber(data.weightLostKg)} kg`} />
      </dl>
      <ProgressBar
        value={data.goalProgressPercent}
        maximum={100}
        label="Weight goal progress"
        valueText={progressText}
        tone={profileProgressTone(profile.name)}
      />
    </div>
  )
}

function NutritionCardContent({ data }: { data: OverviewNutritionData }) {
  if (data.foodEntryCount === 0) {
    return <NotLogged countLabel="food entries" />
  }

  const { summary } = data
  return (
    <>
      <p className="break-words text-[1.5rem] font-bold leading-tight tracking-tight tabular-nums text-app-primary">
        {formatNumber(summary.totalCalories)} kcal
      </p>
      <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <Detail label="Entries" value={formatNumber(data.foodEntryCount)} />
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
    return <NotLogged countLabel="water entries" />
  }

  const progressText = data.progressAgainstCurrentGoalPercentage === null
    ? null
    : percentageText(data.progressAgainstCurrentGoalPercentage)

  return (
    <>
      <p className="break-words text-[1.5rem] font-bold leading-tight tracking-tight tabular-nums text-app-primary">
        {formatNumber(data.totalConsumedMl)} ml
      </p>
      <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <Detail label="Entries" value={formatNumber(data.entryCount)} />
        <Detail
          label="Daily goal"
          value={data.currentDailyGoalMl === null
            ? 'Not available'
            : `${formatNumber(data.currentDailyGoalMl)} ml`}
        />
      </dl>
      {data.currentDailyGoalMl === null || data.progressAgainstCurrentGoalPercentage === null ? (
        <p className="text-supporting text-app-secondary">Goal progress: Not available</p>
      ) : (
        <ProgressBar
          value={data.progressAgainstCurrentGoalPercentage}
          maximum={100}
          label="Hydration goal progress"
          valueText={progressText ?? 'Not available'}
          tone="hydration"
        />
      )}
    </>
  )
}

function ActivityCardContent({ data }: { data: DailyActivitySummary }) {
  if (data.activityCount === 0) {
    return <NotLogged countLabel="activities" />
  }

  return (
    <>
      <p className="break-words text-[1.5rem] font-bold leading-tight tracking-tight tabular-nums text-app-primary">
        {formatDurationMinutes(data.totalDurationMinutes)}
      </p>
      <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
    return <NotLogged countLabel="sleep sessions" />
  }

  return (
    <>
      <p className="break-words text-[1.5rem] font-bold leading-tight tracking-tight tabular-nums text-app-primary">
        {formatDurationMinutes(data.totalSleepMinutes)}
      </p>
      <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
        title="Today"
        description={`Personal health summaries for ${formatLocalDate(today)}. Weight uses the latest available health summary.`}
      />
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,1.05fr)_minmax(0,1.7fr)]">
        <Card
          as="article"
          padding="normal"
          elevated
          className="min-w-0 border-primary-100 bg-app-surface-elevated"
        >
          <div className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone={profileTone(profile.name)} size="large">
              <OverviewIcon name="weight" />
            </IconContainer>
            <div className="min-w-0">
              <p className="text-metadata font-semibold text-primary-700">Latest health</p>
              <h3 className="break-words text-card-title text-app-primary">Weight and progress</h3>
            </div>
          </div>
          {health.loading && health.data === null ? (
            <LoadingState className="mt-5" compact message="Loading health summary..." />
          ) : null}
          {health.error && health.data === null ? (
            <Alert className="mt-5" tone="error" title="Health unavailable">
              {health.error}
            </Alert>
          ) : null}
          {health.data !== null ? (
            <div className="mt-5 space-y-4">
              <HealthCardContent data={health.data} profile={profile} />
              {health.loading ? <LoadingState compact message="Refreshing health summary..." /> : null}
              {health.error ? (
                <Alert tone="warning" title="Showing previously loaded data">{health.error}</Alert>
              ) : null}
            </div>
          ) : null}
        </Card>

        <div className="grid min-w-0 grid-cols-1 gap-4 min-[390px]:grid-cols-2">
          <StatusCard title="Nutrition" icon="nutrition" tone="nutrition" state={nutrition}>
            {(data) => <NutritionCardContent data={data} />}
          </StatusCard>
          <StatusCard title="Hydration" icon="hydration" tone="hydration" state={hydration}>
            {(data) => <HydrationCardContent data={data} />}
          </StatusCard>
          <StatusCard title="Activity" icon="activity" tone="activity" state={activity}>
            {(data) => <ActivityCardContent data={data} />}
          </StatusCard>
          <StatusCard title="Sleep" icon="sleep" tone="sleep" state={sleep}>
            {(data) => <SleepCardContent data={data} />}
          </StatusCard>
        </div>
      </div>
    </section>
  )
}
