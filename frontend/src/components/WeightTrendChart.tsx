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
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'

interface WeightTrendChartProps {
  weightDataPoints: WeightDataPoint[]
}

const chartGridColor = 'rgb(var(--color-border-muted))'
const chartTextColor = 'rgb(var(--color-text-secondary))'
const chartSurfaceColor = 'rgb(var(--color-surface-elevated))'
const chartBorderColor = 'rgb(var(--color-border))'
const primaryColor = 'rgb(var(--color-primary))'

export default function WeightTrendChart({ weightDataPoints }: WeightTrendChartProps) {
  return (
    <Card
      as="section"
      padding="normal"
      elevated
      className="min-w-0 border-primary-100 bg-primary-50/25"
      aria-labelledby="weight-trend-heading"
    >
      <SectionHeader
        headingId="weight-trend-heading"
        headingLevel={3}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="primary">
              <TrackingIcon name="weight" />
            </IconContainer>
            <span>Weight trend</span>
          </span>
        )}
        description="Recorded Health Metric weights within the selected date range; direction is shown without judgement."
      />

      {weightDataPoints.length === 0 ? (
        <div className="mt-5">
          <AnalyticsEmptyState
            title="No weight records in this range"
            description="Add Health Metrics records to display recorded weights."
            iconName="weight"
          />
        </div>
      ) : (
        <>
          {weightDataPoints.length === 1 ? (
            <Alert className="mt-5" tone="warning" title="One weight record available">
              A trend requires at least two recorded weights.
            </Alert>
          ) : null}
          <div
            className="mt-5 h-72 min-h-72 w-full min-w-0 sm:h-80"
            role="img"
            aria-label="Weight in kilograms by recorded date for the loaded analytics range"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightDataPoints} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 4" stroke={chartGridColor} vertical={false} />
                <XAxis
                  axisLine={{ stroke: chartGridColor }}
                  dataKey="date"
                  minTickGap={24}
                  tick={{ fill: chartTextColor, fontSize: 12 }}
                  tickFormatter={formatAnalyticsShortDate}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tick={{ fill: chartTextColor, fontSize: 12 }}
                  tickFormatter={(value: number) => formatAnalyticsNumber(value)}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartSurfaceColor,
                    border: `1px solid ${chartBorderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTextColor,
                  }}
                  itemStyle={{ color: chartTextColor }}
                  labelStyle={{ color: chartTextColor, fontWeight: 600 }}
                  labelFormatter={(label) => formatAnalyticsDate(String(label))}
                  formatter={(value) => [`${formatAnalyticsNumber(Number(value))} kg`, 'Weight']}
                />
                <Line
                  activeDot={{ fill: chartSurfaceColor, r: 6, stroke: primaryColor, strokeWidth: 2 }}
                  dataKey="weightKg"
                  dot={{ fill: chartSurfaceColor, r: 4, stroke: primaryColor, strokeWidth: 2 }}
                  isAnimationActive={false}
                  name="Weight"
                  stroke={primaryColor}
                  strokeWidth={2.5}
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
