import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeightDataPoint } from '../types/Analytics'
import { formatAnalyticsDate, formatAnalyticsNumber, formatAnalyticsShortDate } from '../utils/analyticsFormatting'
import AnalyticsEmptyState from './AnalyticsEmptyState'

interface WeightTrendChartProps {
  weightDataPoints: WeightDataPoint[]
}

export default function WeightTrendChart({ weightDataPoints }: WeightTrendChartProps) {
  if (weightDataPoints.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="weight-trend-heading">
        <h4 id="weight-trend-heading" className="text-base font-semibold text-gray-900">Weight trend</h4>
        <div className="mt-4">
          <AnalyticsEmptyState
            title="No weight records in this range"
            description="Add Health Metrics records to see actual recorded weights here."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="weight-trend-heading">
      <div>
        <h4 id="weight-trend-heading" className="text-base font-semibold text-gray-900">Weight trend</h4>
        <p className="mt-1 text-sm text-gray-500">Actual Health Metrics records in the selected range.</p>
        {weightDataPoints.length === 1 && (
          <p className="mt-2 text-sm font-medium text-amber-700">One weight record is available; a trend needs more records.</p>
        )}
      </div>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weightDataPoints} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tickFormatter={formatAnalyticsShortDate} minTickGap={24} />
            <YAxis tickFormatter={(value: number) => `${formatAnalyticsNumber(value)} kg`} width={62} />
            <Tooltip
              labelFormatter={(label) => formatAnalyticsDate(String(label))}
              formatter={(value) => [`${formatAnalyticsNumber(Number(value))} kg`, 'Weight']}
            />
            <Line
              dataKey="weightKg"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Weight"
              stroke="#0284c7"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
