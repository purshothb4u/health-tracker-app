import type { HydrationSummary } from '../types/WaterTracking'

interface HydrationSummaryCardProps {
  summary: HydrationSummary
}

function formatWholeNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatWaterAmount(value: number | null): string {
  if (value === null) {
    return 'Not available'
  }

  const millilitres = `${formatWholeNumber(value)} ml`
  if (value < 1000) {
    return millilitres
  }

  const litres = (value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })
  return `${millilitres} (${litres} L)`
}

function formatPercentage(value: number | null): string {
  return value === null ? 'Not available' : `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

export default function HydrationSummaryCard({ summary }: HydrationSummaryCardProps) {
  const percentage = summary.progressAgainstCurrentGoalPercentage
  const progressWidth = percentage === null ? 0 : Math.min(Math.max(percentage, 0), 100)
  const goalStatus =
    summary.goalReached === null
      ? 'Set a daily water goal to view progress.'
      : summary.goalReached
        ? 'Current goal reached for this date.'
        : 'Current goal has not yet been reached for this date.'

  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
      <div>
        <h4 className="text-base font-semibold text-gray-900">Hydration summary</h4>
        <p className="mt-1 text-sm text-gray-600">Totals for the selected date</p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Total consumed</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formatWaterAmount(summary.totalConsumedMl)}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Current daily goal</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formatWaterAmount(summary.currentDailyGoalMl)}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Remaining</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatWaterAmount(summary.remainingAgainstCurrentGoalMl)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Excess</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatWaterAmount(summary.excessAgainstCurrentGoalMl)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Progress</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formatPercentage(percentage)}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Entries</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formatWholeNumber(summary.entryCount)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="font-medium text-gray-700">{goalStatus}</span>
          <span className="font-semibold text-gray-900">
            {percentage === null ? 'Not available' : `${formatPercentage(percentage)} of current goal`}
          </span>
        </div>
        <div
          aria-label="Hydration progress"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percentage === null ? undefined : Math.round(progressWidth)}
          aria-valuetext={
            percentage === null
              ? 'Progress is not available without a configured goal.'
              : `${formatPercentage(percentage)} of current goal. Visual progress is capped at 100 percent.`
          }
          className="mt-2 h-3 overflow-hidden rounded-full bg-white"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-primary-600" style={{ width: `${progressWidth}%` }} />
        </div>
      </div>
    </section>
  )
}
