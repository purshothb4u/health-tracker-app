import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyNutritionDataPoint } from '../types/Analytics'
import { formatAnalyticsDate, formatAnalyticsNumber, formatAnalyticsShortDate } from '../utils/analyticsFormatting'
import AnalyticsEmptyState from './AnalyticsEmptyState'

interface CalorieTrendChartProps {
  dailyNutritionDataPoints: DailyNutritionDataPoint[]
  currentMaintenanceCaloriesEstimate: number | null
}

export default function CalorieTrendChart({
  dailyNutritionDataPoints,
  currentMaintenanceCaloriesEstimate,
}: CalorieTrendChartProps) {
  const hasFoodLogs = dailyNutritionDataPoints.some((point) => point.foodEntryCount > 0)

  if (!hasFoodLogs) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="calorie-trend-heading">
        <h4 id="calorie-trend-heading" className="text-base font-semibold text-gray-900">Calorie trend</h4>
        <div className="mt-4">
          <AnalyticsEmptyState
            title="No food logged in this range"
            description="Unlogged dates are not treated as confirmed zero intake."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="calorie-trend-heading">
      <div>
        <h4 id="calorie-trend-heading" className="text-base font-semibold text-gray-900">Calorie trend</h4>
        <p className="mt-1 text-sm text-gray-500">Total logged calories by date.</p>
      </div>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyNutritionDataPoints} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tickFormatter={formatAnalyticsShortDate} minTickGap={24} />
            <YAxis tickFormatter={(value: number) => `${formatAnalyticsNumber(value)} kcal`} width={72} />
            <Tooltip
              labelFormatter={(label) => formatAnalyticsDate(String(label))}
              formatter={(value, _name, item) => {
                const point = item.payload as DailyNutritionDataPoint
                const status = point.foodEntryCount === 0 ? 'No food logged' : 'Food logged'
                return [`${formatAnalyticsNumber(Number(value))} kcal (${status})`, 'Calories']
              }}
            />
            {currentMaintenanceCaloriesEstimate !== null && (
              <ReferenceLine
                label={{ value: 'Current maintenance estimate', position: 'insideTopRight', fill: '#4b5563', fontSize: 12 }}
                stroke="#6b7280"
                strokeDasharray="4 4"
                y={currentMaintenanceCaloriesEstimate}
              />
            )}
            <Bar dataKey="totalCalories" fill="#0284c7" name="Calories" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
