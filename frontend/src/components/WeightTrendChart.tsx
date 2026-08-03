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
import { Alert } from './ui/Alert'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

interface WeightTrendChartProps {
  weightDataPoints: WeightDataPoint[]
}

export default function WeightTrendChart({ weightDataPoints }: WeightTrendChartProps) {
  return (
    <Card as="section" padding="normal" className="min-w-0" aria-labelledby="weight-trend-heading">
      <SectionHeader
        headingId="weight-trend-heading"
        headingLevel={3}
        title="Weight trend"
        description="Recorded Health Metric weights across the selected date range."
      />

      {weightDataPoints.length === 0 ? (
        <div className="mt-5">
          <AnalyticsEmptyState
            title="No weight records in this range"
            description="Add Health Metrics records to display recorded weights."
          />
        </div>
      ) : (
        <>
          {weightDataPoints.length === 1 ? (
            <Alert className="mt-5" tone="warning" title="One weight record available">
              A trend requires at least two recorded weights.
            </Alert>
          ) : null}
          <div className="mt-5 h-72 min-h-72 w-full min-w-0 sm:h-80" aria-label="Weight trend chart">
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
        </>
      )}
    </Card>
  )
}
