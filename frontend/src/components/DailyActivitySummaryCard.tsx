import type { DailyActivitySummary } from '../types/ActivityTracking'
import { formatDurationMinutes, formatLocalDate } from '../utils/dateFormatting'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

interface DailyActivitySummaryCardProps {
  summary: DailyActivitySummary
}

function formatSteps(steps: number | null): string {
  return steps === null ? 'Not available' : `${steps.toLocaleString()} steps`
}

function formatDistance(distanceKm: number | null): string {
  return distanceKm === null
    ? 'Not available'
    : `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 3 })} km`
}

function formatReportedCalories(calories: number | null): string {
  return calories === null ? 'Not available' : `${calories.toLocaleString()} kcal reported`
}

export default function DailyActivitySummaryCard({ summary }: DailyActivitySummaryCardProps) {
  return (
    <Card as="section" padding="normal" aria-labelledby={`activity-summary-heading-${summary.userProfileId}`}>
      <SectionHeader
        headingId={`activity-summary-heading-${summary.userProfileId}`}
        headingLevel={3}
        title="Daily activity summary"
        description={`Backend-calculated totals for ${formatLocalDate(summary.activityDate)}.`}
      />

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-primary-50 p-4">
          <dt className="text-app-secondary">Activities</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">{summary.activityCount.toLocaleString()}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Total duration</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatDurationMinutes(summary.totalDurationMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Reported steps</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">{formatSteps(summary.reportedSteps)}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Reported distance</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatDistance(summary.reportedDistanceKm)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2 xl:col-span-2">
          <dt className="text-app-secondary">Reported calories burned</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatReportedCalories(summary.reportedCaloriesBurned)}
          </dd>
          <p className="mt-1 text-xs text-app-secondary">User-reported value; not automatically calculated.</p>
        </div>
      </dl>
    </Card>
  )
}
