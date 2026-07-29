import type { DailyNutritionSummary } from '../types/FoodEntry'

interface DailyNutritionSummaryCardProps {
  summary: DailyNutritionSummary
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatCalories(value: number | null): string {
  return value === null ? 'Not available' : `${formatNumber(value)} kcal`
}

export default function DailyNutritionSummaryCard({ summary }: DailyNutritionSummaryCardProps) {
  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
      <div>
        <h4 className="text-base font-semibold text-gray-900">Daily nutrition summary</h4>
        <p className="mt-1 text-sm text-gray-600">Totals for the selected date</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Total calories</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formatNumber(summary.totalCalories)} kcal</dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Maintenance calories</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatCalories(summary.maintenanceCalories)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Remaining calories</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatCalories(summary.remainingCalories)}
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Protein</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatNumber(summary.totalProteinGrams)} g
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Carbohydrates</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">
            {formatNumber(summary.totalCarbohydrateGrams)} g
          </dd>
        </div>
        <div className="rounded-xl bg-white p-3">
          <dt className="text-gray-500">Fat</dt>
          <dd className="mt-1 text-lg font-bold text-gray-900">{formatNumber(summary.totalFatGrams)} g</dd>
        </div>
      </dl>
    </section>
  )
}
