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
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface CalorieTrendChartProps {
  dailyNutritionDataPoints: DailyNutritionDataPoint[]
  currentMaintenanceCaloriesEstimate: number | null
}

interface CalorieChartPoint extends DailyNutritionDataPoint {
  plottedCalories: number | null
}

const chartGridColor = 'rgb(var(--color-border-muted))'
const chartTextColor = 'rgb(var(--color-text-secondary))'
const chartSurfaceColor = 'rgb(var(--color-surface-elevated))'
const chartBorderColor = 'rgb(var(--color-border))'
const nutritionColor = 'rgb(var(--color-metric-nutrition))'
const maintenanceColor = 'rgb(var(--color-text-secondary))'

export default function CalorieTrendChart({
  dailyNutritionDataPoints,
  currentMaintenanceCaloriesEstimate,
}: CalorieTrendChartProps) {
  const hasFoodLogs = dailyNutritionDataPoints.some((point) => point.foodEntryCount > 0)
  const chartData: CalorieChartPoint[] = dailyNutritionDataPoints.map((point) => ({
    ...point,
    plottedCalories: point.foodEntryCount > 0 ? point.totalCalories : null,
  }))

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      className="min-w-0 border-metric-nutrition/25 bg-metric-nutrition-surface/30"
      aria-labelledby="calorie-trend-heading"
    >
      <SectionHeader
        headingId="calorie-trend-heading"
        headingLevel={3}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="nutrition">
              <TrackingIcon name="nutrition" />
            </IconContainer>
            <span>Calorie trend</span>
          </span>
        )}
        description="Bars show logged calories by date. Gaps mean no food was logged, while a small zero bar means food was logged with zero calories."
      />

      {!hasFoodLogs ? (
        <div className="mt-5">
          <AnalyticsEmptyState
            title="No food logged in this range"
            description="Unlogged dates are not treated as confirmed zero intake."
            iconName="nutrition"
            iconTone="nutrition"
          />
        </div>
      ) : (
        <>
          <div className="mt-4">
            {currentMaintenanceCaloriesEstimate === null ? (
              <StatusBadge tone="neutral">Current maintenance estimate: Not available</StatusBadge>
            ) : (
              <StatusBadge tone="nutrition">
                Dashed reference: {formatAnalyticsNumber(currentMaintenanceCaloriesEstimate)} kcal current maintenance estimate
              </StatusBadge>
            )}
          </div>
          <div
            className="mt-5 h-72 min-h-72 w-full min-w-0 sm:h-80"
            role="img"
            aria-label="Logged calories by date with an optional current maintenance estimate reference"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
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
                  tick={{ fill: chartTextColor, fontSize: 12 }}
                  tickFormatter={(value: number) => formatAnalyticsNumber(value)}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartSurfaceColor,
                    border: `1px solid ${chartBorderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTextColor,
                  }}
                  cursor={{ fill: 'rgb(var(--color-primary-50))' }}
                  itemStyle={{ color: chartTextColor }}
                  labelStyle={{ color: chartTextColor, fontWeight: 600 }}
                  labelFormatter={(label) => formatAnalyticsDate(String(label))}
                  formatter={(value, _name, item) => {
                    const point = item.payload as CalorieChartPoint
                    const status = point.foodEntryCount === 0 ? 'No food logged' : 'Food logged'
                    return [`${formatAnalyticsNumber(Number(value))} kcal (${status})`, 'Calories']
                  }}
                />
                {currentMaintenanceCaloriesEstimate !== null ? (
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    stroke={maintenanceColor}
                    strokeDasharray="5 5"
                    y={currentMaintenanceCaloriesEstimate}
                  />
                ) : null}
                <Bar
                  dataKey="plottedCalories"
                  fill={nutritionColor}
                  isAnimationActive={false}
                  minPointSize={3}
                  name="Calories"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
