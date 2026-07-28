import type { HealthSummary } from '../types/HealthMetric'

interface HealthSummaryCardProps {
  summary: HealthSummary
}

function formatCalories(value: number | null): string {
  return value === null ? 'Unavailable' : `${value} kcal`
}

export default function HealthSummaryCard({ summary }: HealthSummaryCardProps) {
  const progressWidth = `${Math.min(100, Math.max(0, summary.goalProgressPercent))}%`

  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Health summary</h4>
          <p className="mt-1 text-sm text-gray-600">Based on your latest recorded weight</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700">
          {summary.goalProgressPercent.toFixed(1)}% goal
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Latest weight</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{summary.latestWeightKg} kg</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">BMI</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{summary.bmi.toFixed(2)}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">BMR</dt>
          <dd className="mt-1 font-semibold text-gray-900">{formatCalories(summary.bmrCaloriesPerDay)}</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Maintenance</dt>
          <dd className="mt-1 font-semibold text-gray-900">
            {formatCalories(summary.maintenanceCaloriesPerDay)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">Weight progress</span>
          <span className="font-medium text-gray-900">{summary.goalProgressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-primary-500" style={{ width: progressWidth }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-primary-100 bg-white px-3 py-2">
          <p className="text-gray-500">Lost so far</p>
          <p className="font-semibold text-gray-900">{summary.weightLostKg} kg</p>
        </div>
        <div className="rounded-lg border border-primary-100 bg-white px-3 py-2">
          <p className="text-gray-500">Remaining</p>
          <p className="font-semibold text-gray-900">{summary.weightRemainingKg} kg</p>
        </div>
      </div>
    </section>
  )
}
