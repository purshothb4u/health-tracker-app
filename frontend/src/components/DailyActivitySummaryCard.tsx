import type { DailyActivitySummary } from '../types/ActivityTracking'

interface DailyActivitySummaryCardProps {
  summary: DailyActivitySummary
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }
  if (minutes === 0) {
    return `${hours} hr`
  }
  return `${hours} hr ${minutes} min`
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
    <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
      <div>
        <h4 className="text-base font-semibold text-gray-900">Daily activity summary</h4>
        <p className="mt-1 text-sm text-gray-600">Recorded totals for the selected date</p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Activities</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{summary.activityCount.toLocaleString()}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Total duration</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatDuration(summary.totalDurationMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Reported steps</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formatSteps(summary.reportedSteps)}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Reported distance</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatDistance(summary.reportedDistanceKm)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3 sm:col-span-2">
          <dt className="text-gray-500">Reported calories burned</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatReportedCalories(summary.reportedCaloriesBurned)}
          </dd>
          <p className="mt-1 text-xs text-gray-500">User-reported value; not automatically calculated.</p>
        </div>
      </dl>
    </section>
  )
}
