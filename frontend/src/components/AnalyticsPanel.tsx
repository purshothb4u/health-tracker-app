import { useAnalytics } from '../hooks/useAnalytics'
import { formatAnalyticsDate } from '../utils/analyticsFormatting'
import TrackingIcon from './TrackingIcon'
import AnalyticsDateRangeSelector from './AnalyticsDateRangeSelector'
import AnalyticsEmptyState from './AnalyticsEmptyState'
import AnalyticsSummaryCards from './AnalyticsSummaryCards'
import CalorieTrendChart from './CalorieTrendChart'
import MacronutrientTrendChart from './MacronutrientTrendChart'
import WeightTrendChart from './WeightTrendChart'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'
import { IconContainer } from './ui/IconContainer'
import { StatusBadge } from './ui/StatusBadge'

interface AnalyticsPanelProps {
  userProfileId: number
  profileName: string
}

export default function AnalyticsPanel({ userProfileId, profileName }: AnalyticsPanelProps) {
  const {
    fromDate,
    toDate,
    selectedPreset,
    analytics,
    loading,
    error,
    rangeError,
    selectPreset,
    setCustomRange,
    setFromDate,
    setToDate,
    reload,
  } = useAnalytics(userProfileId)

  const isRefreshing = loading && analytics !== null

  return (
    <section className="min-w-0 space-y-rhythm" aria-labelledby={`analytics-heading-${userProfileId}`}>
      <SectionHeader
        headingId={`analytics-heading-${userProfileId}`}
        headingLevel={2}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="primary">
              <TrackingIcon name="trend" />
            </IconContainer>
            <span className="min-w-0 break-words">Analytics for {profileName}</span>
          </span>
        )}
        description="Understand recorded weight and nutrition patterns across an inclusive date range."
        actions={isRefreshing ? <LoadingState compact message="Refreshing analytics..." /> : undefined}
      />

      <AnalyticsDateRangeSelector
        fromDate={fromDate}
        toDate={toDate}
        selectedPreset={selectedPreset}
        rangeError={rangeError}
        onFromDateChange={setFromDate}
        onSelectCustom={() => setCustomRange(fromDate, toDate)}
        onSelectPreset={selectPreset}
        onToDateChange={setToDate}
      />

      <div className="min-w-0 space-y-6" aria-busy={loading}>
        {loading && analytics === null ? <LoadingState message="Loading analytics..." /> : null}

        {error ? (
          <Alert
            tone="error"
            title="Unable to load analytics"
            action={<Button variant="secondary" size="compact" onClick={reload}>Retry</Button>}
          >
            {error}
          </Alert>
        ) : null}

        {!loading && !error && analytics === null && rangeError === null ? (
          <AnalyticsEmptyState
            title="Analytics are not available"
            description="Try reloading the selected range."
          />
        ) : null}

        {analytics ? (
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="neutral">
                Loaded range: <time dateTime={analytics.fromDate}>{formatAnalyticsDate(analytics.fromDate)}</time>
                {' to '}
                <time dateTime={analytics.toDate}>{formatAnalyticsDate(analytics.toDate)}</time>
              </StatusBadge>
            </div>
            <AnalyticsSummaryCards
              nutritionAnalytics={analytics.nutritionAnalytics}
              weightAnalytics={analytics.weightAnalytics}
            />
            <div className="grid min-w-0 gap-6 xl:grid-cols-2">
              <WeightTrendChart weightDataPoints={analytics.weightAnalytics.weightDataPoints} />
              <CalorieTrendChart
                currentMaintenanceCaloriesEstimate={analytics.nutritionAnalytics.currentMaintenanceCaloriesEstimate}
                dailyNutritionDataPoints={analytics.nutritionAnalytics.dailyNutritionDataPoints}
              />
            </div>
            <MacronutrientTrendChart dailyNutritionDataPoints={analytics.nutritionAnalytics.dailyNutritionDataPoints} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
