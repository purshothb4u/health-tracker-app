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
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface CalorieTrendChartProps {
  dailyNutritionDataPoints: DailyNutritionDataPoint[]
  currentMaintenanceCaloriesEstimate: number | null
}

export default function CalorieTrendChart({
  dailyNutritionDataPoints,
  currentMaintenanceCaloriesEstimate,
}: CalorieTrendChartProps) {
  const hasFoodLogs = dailyNutritionDataPoints.some((point) => point.foodEntryCount > 0)

  return (
    <Card as="section" padding="normal" className="min-w-0" aria-labelledby="calorie-trend-heading">
      <SectionHeader
        headingId="calorie-trend-heading"
        headingLevel={3}
        title="Calorie trend"
        description="Bars show logged calories by date; unlogged dates are not treated as confirmed zero intake."
      />

      {!hasFoodLogs ? (
        <div className="mt-5">
          <AnalyticsEmptyState
            title="No food logged in this range"
            description="Unlogged dates are not treated as confirmed zero intake."
          />
        </div>
      ) : (
        <>
          <div className="mt-4">
            {currentMaintenanceCaloriesEstimate === null ? (
              <StatusBadge tone="neutral">Current maintenance estimate: Not available</StatusBadge>
            ) : (
              <StatusBadge tone="information">
                Dashed reference: {formatAnalyticsNumber(currentMaintenanceCaloriesEstimate)} kcal current maintenance estimate
              </StatusBadge>
            )}
          </div>
          <div className="mt-5 h-72 min-h-72 w-full min-w-0 sm:h-80" aria-label="Calorie trend chart">
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
                {currentMaintenanceCaloriesEstimate !== null ? (
                  <ReferenceLine
                    label={{ value: 'Current maintenance estimate', position: 'insideTopRight', fill: '#4b5563', fontSize: 12 }}
                    stroke="#6b7280"
                    strokeDasharray="4 4"
                    y={currentMaintenanceCaloriesEstimate}
                  />
                ) : null}
                <Bar dataKey="totalCalories" fill="#0284c7" name="Calories" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
