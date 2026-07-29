import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyNutritionDataPoint } from '../types/Analytics'
import { formatAnalyticsDate, formatAnalyticsNumber, formatAnalyticsShortDate } from '../utils/analyticsFormatting'
import AnalyticsEmptyState from './AnalyticsEmptyState'

interface MacronutrientTrendChartProps {
  dailyNutritionDataPoints: DailyNutritionDataPoint[]
}

export default function MacronutrientTrendChart({
  dailyNutritionDataPoints,
}: MacronutrientTrendChartProps) {
  const hasFoodLogs = dailyNutritionDataPoints.some((point) => point.foodEntryCount > 0)

  if (!hasFoodLogs) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="macronutrient-trend-heading">
        <h4 id="macronutrient-trend-heading" className="text-base font-semibold text-gray-900">Macronutrient trend</h4>
        <div className="mt-4">
          <AnalyticsEmptyState
            title="No food logged in this range"
            description="Log food entries to see protein, carbohydrates, and fat trends."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="macronutrient-trend-heading">
      <div>
        <h4 id="macronutrient-trend-heading" className="text-base font-semibold text-gray-900">Macronutrient trend</h4>
        <p className="mt-1 text-sm text-gray-500">Daily logged macronutrients in grams.</p>
      </div>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyNutritionDataPoints} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tickFormatter={formatAnalyticsShortDate} minTickGap={24} />
            <YAxis tickFormatter={(value: number) => `${formatAnalyticsNumber(value)} g`} width={58} />
            <Tooltip
              labelFormatter={(label, payload) => {
                const point = payload[0]?.payload as DailyNutritionDataPoint | undefined
                const status = point?.foodEntryCount === 0 ? ' — No food logged' : ''
                return `${formatAnalyticsDate(String(label))}${status}`
              }}
              formatter={(value, name) => [`${formatAnalyticsNumber(Number(value))} g`, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Line dataKey="totalProteinGrams" dot={false} name="Protein" stroke="#0284c7" strokeWidth={2} type="monotone" />
            <Line dataKey="totalCarbohydrateGrams" dot={false} name="Carbohydrates" stroke="#7c3aed" strokeWidth={2} type="monotone" />
            <Line dataKey="totalFatGrams" dot={false} name="Fat" stroke="#ea580c" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
