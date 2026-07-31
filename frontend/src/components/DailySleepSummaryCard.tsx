import type { DailySleepSummary } from '../types/SleepTracking'

interface DailySleepSummaryCardProps {
  summary: DailySleepSummary
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

function formatAverageQuality(averageQuality: number | null): string {
  return averageQuality === null
    ? 'Not available'
    : `${averageQuality.toLocaleString(undefined, { maximumFractionDigits: 2 })} / 5`
}

export default function DailySleepSummaryCard({ summary }: DailySleepSummaryCardProps) {
  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
      <div>
        <h4 className="text-base font-semibold text-gray-900">Daily sleep summary</h4>
        <p className="mt-1 text-sm text-gray-600">Recorded totals for the selected date</p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Sessions</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {summary.sessionCount.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Total sleep</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatDuration(summary.totalSleepMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Night sleep</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatDuration(summary.nightSleepMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Nap duration</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatDuration(summary.napMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3 sm:col-span-2">
          <dt className="text-gray-500">Average quality</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatAverageQuality(summary.averageQuality)}
          </dd>
          <p className="mt-1 text-xs text-gray-500">Average of rated sessions only.</p>
        </div>
      </dl>
    </section>
  )
}
