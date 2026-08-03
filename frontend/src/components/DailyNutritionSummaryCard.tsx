import type { DailyNutritionSummary } from '../types/FoodEntry'
import { formatLocalDate } from '../utils/dateFormatting'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

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
    <Card as="section" padding="normal" aria-labelledby={`nutrition-summary-heading-${summary.userProfileId}`}>
      <SectionHeader
        headingId={`nutrition-summary-heading-${summary.userProfileId}`}
        headingLevel={3}
        title="Daily nutrition summary"
        description={`Backend-calculated totals for ${formatLocalDate(summary.entryDate)}.`}
      />

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-primary-50 p-4">
          <dt className="text-app-secondary">Total calories</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">{formatNumber(summary.totalCalories)} kcal</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Maintenance calories</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatCalories(summary.maintenanceCalories)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Remaining calories</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatCalories(summary.remainingCalories)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Protein</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatNumber(summary.totalProteinGrams)} g
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Carbohydrates</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatNumber(summary.totalCarbohydrateGrams)} g
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Fat</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">{formatNumber(summary.totalFatGrams)} g</dd>
        </div>
      </dl>
    </Card>
  )
}
