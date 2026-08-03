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
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

interface MacronutrientTrendChartProps {
  dailyNutritionDataPoints: DailyNutritionDataPoint[]
}

export default function MacronutrientTrendChart({
  dailyNutritionDataPoints,
}: MacronutrientTrendChartProps) {
  const hasFoodLogs = dailyNutritionDataPoints.some((point) => point.foodEntryCount > 0)

  return (
    <Card as="section" padding="normal" className="min-w-0" aria-labelledby="macronutrient-trend-heading">
      <SectionHeader
        headingId="macronutrient-trend-heading"
        headingLevel={3}
        title="Macronutrient trend"
        description="Labelled lines compare daily logged protein, carbohydrates, and fat in grams."
      />

      {!hasFoodLogs ? (
        <div className="mt-5">
          <AnalyticsEmptyState
            title="No food logged in this range"
            description="Log food entries to display protein, carbohydrate, and fat trends."
          />
        </div>
      ) : (
        <div className="mt-5 h-80 min-h-80 w-full min-w-0 sm:h-96" aria-label="Macronutrient trend chart">
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
      )}
    </Card>
  )
}
