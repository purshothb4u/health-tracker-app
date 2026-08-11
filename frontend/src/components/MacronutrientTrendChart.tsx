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
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'

interface MacronutrientTrendChartProps {
  dailyNutritionDataPoints: DailyNutritionDataPoint[]
}

interface MacronutrientChartPoint extends DailyNutritionDataPoint {
  plottedProteinGrams: number | null
  plottedCarbohydrateGrams: number | null
  plottedFatGrams: number | null
}

type MacronutrientValueKey =
  | 'plottedProteinGrams'
  | 'plottedCarbohydrateGrams'
  | 'plottedFatGrams'

interface MacronutrientDotProps {
  cx?: number
  cy?: number
  index?: number
}

const chartGridColor = 'rgb(var(--color-border-muted))'
const chartTextColor = 'rgb(var(--color-text-secondary))'
const chartSurfaceColor = 'rgb(var(--color-surface-elevated))'
const chartBorderColor = 'rgb(var(--color-border))'
const proteinColor = 'rgb(var(--color-metric-nutrition))'
const carbohydrateColor = 'rgb(var(--color-metric-hydration))'
const fatColor = 'rgb(var(--color-metric-activity))'

function IsolatedMacronutrientDot({
  chartData,
  color,
  dataKey,
  dot,
}: {
  chartData: MacronutrientChartPoint[]
  color: string
  dataKey: MacronutrientValueKey
  dot: MacronutrientDotProps
}) {
  const index = dot.index ?? -1
  const current = chartData[index]?.[dataKey]
  const previous = chartData[index - 1]?.[dataKey]
  const next = chartData[index + 1]?.[dataKey]
  const isIsolated = current !== null && current !== undefined
    && (previous === null || previous === undefined)
    && (next === null || next === undefined)

  if (!isIsolated || dot.cx === undefined || dot.cy === undefined) {
    return <></>
  }

  return (
    <circle
      cx={dot.cx}
      cy={dot.cy}
      fill={chartSurfaceColor}
      r={2.5}
      stroke={color}
      strokeWidth={1.5}
    />
  )
}

export default function MacronutrientTrendChart({
  dailyNutritionDataPoints,
}: MacronutrientTrendChartProps) {
  const hasFoodLogs = dailyNutritionDataPoints.some((point) => point.foodEntryCount > 0)
  const chartData: MacronutrientChartPoint[] = dailyNutritionDataPoints.map((point) => {
    const logged = point.foodEntryCount > 0
    return {
      ...point,
      plottedProteinGrams: logged ? point.totalProteinGrams : null,
      plottedCarbohydrateGrams: logged ? point.totalCarbohydrateGrams : null,
      plottedFatGrams: logged ? point.totalFatGrams : null,
    }
  })

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      className="min-w-0 border-metric-nutrition/25 bg-app-surface-elevated"
      aria-labelledby="macronutrient-trend-heading"
    >
      <SectionHeader
        headingId="macronutrient-trend-heading"
        headingLevel={3}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="nutrition">
              <TrackingIcon name="nutrition" />
            </IconContainer>
            <span>Macronutrient trend</span>
          </span>
        )}
        description="Labelled solid, dashed, and dotted lines compare logged protein, carbohydrates, and fat. Unlogged dates appear as gaps."
      />

      {!hasFoodLogs ? (
        <div className="mt-5">
          <AnalyticsEmptyState
            title="No food logged in this range"
            description="Log food entries to display protein, carbohydrate, and fat trends."
            iconName="nutrition"
            iconTone="nutrition"
          />
        </div>
      ) : (
        <div
          className="mt-5 h-80 min-h-80 w-full min-w-0 sm:h-96"
          role="img"
          aria-label="Logged protein, carbohydrate, and fat grams by date; unlogged dates are gaps"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
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
                formatter={(value, name) => [`${formatAnalyticsNumber(Number(value))} g`, String(name)]}
              />
              <Legend wrapperStyle={{ color: chartTextColor, fontSize: '0.8125rem', paddingTop: '0.5rem' }} />
              <Line
                activeDot={{ r: 5 }}
                connectNulls={false}
                dataKey="plottedProteinGrams"
                dot={(dot: MacronutrientDotProps) => (
                  <IsolatedMacronutrientDot
                    chartData={chartData}
                    color={proteinColor}
                    dataKey="plottedProteinGrams"
                    dot={dot}
                  />
                )}
                isAnimationActive={false}
                name="Protein"
                stroke={proteinColor}
                strokeWidth={2.5}
                type="monotone"
              />
              <Line
                activeDot={{ r: 5 }}
                connectNulls={false}
                dataKey="plottedCarbohydrateGrams"
                dot={(dot: MacronutrientDotProps) => (
                  <IsolatedMacronutrientDot
                    chartData={chartData}
                    color={carbohydrateColor}
                    dataKey="plottedCarbohydrateGrams"
                    dot={dot}
                  />
                )}
                isAnimationActive={false}
                name="Carbohydrates"
                stroke={carbohydrateColor}
                strokeDasharray="7 4"
                strokeWidth={2.5}
                type="monotone"
              />
              <Line
                activeDot={{ r: 5 }}
                connectNulls={false}
                dataKey="plottedFatGrams"
                dot={(dot: MacronutrientDotProps) => (
                  <IsolatedMacronutrientDot
                    chartData={chartData}
                    color={fatColor}
                    dataKey="plottedFatGrams"
                    dot={dot}
                  />
                )}
                isAnimationActive={false}
                name="Fat"
                stroke={fatColor}
                strokeDasharray="2 4"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
