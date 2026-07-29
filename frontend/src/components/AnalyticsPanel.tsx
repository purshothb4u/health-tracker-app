import AnalyticsDateRangeSelector from './AnalyticsDateRangeSelector'
import AnalyticsEmptyState from './AnalyticsEmptyState'
import AnalyticsSummaryCards from './AnalyticsSummaryCards'
import CalorieTrendChart from './CalorieTrendChart'
import MacronutrientTrendChart from './MacronutrientTrendChart'
import WeightTrendChart from './WeightTrendChart'
import { useAnalytics } from '../hooks/useAnalytics'

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
    <section className="space-y-4" aria-labelledby={`analytics-heading-${userProfileId}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id={`analytics-heading-${userProfileId}`} className="text-lg font-semibold text-gray-900">
            Analytics for {profileName}
          </h3>
          <p className="mt-1 text-sm text-gray-500">Selected-range weight and nutrition trends.</p>
        </div>
        {isRefreshing && <span className="text-sm font-medium text-primary-700">Refreshing analytics...</span>}
      </div>

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

      {loading && analytics === null && (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-6 shadow-sm" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading analytics...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4" role="alert">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            type="button"
            onClick={reload}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && analytics === null && rangeError === null && (
        <AnalyticsEmptyState title="Analytics are not available" description="Try reloading the selected range." />
      )}

      {analytics && (
        <>
          <AnalyticsSummaryCards
            nutritionAnalytics={analytics.nutritionAnalytics}
            weightAnalytics={analytics.weightAnalytics}
          />
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <WeightTrendChart weightDataPoints={analytics.weightAnalytics.weightDataPoints} />
            <CalorieTrendChart
              currentMaintenanceCaloriesEstimate={analytics.nutritionAnalytics.currentMaintenanceCaloriesEstimate}
              dailyNutritionDataPoints={analytics.nutritionAnalytics.dailyNutritionDataPoints}
            />
          </div>
          <MacronutrientTrendChart dailyNutritionDataPoints={analytics.nutritionAnalytics.dailyNutritionDataPoints} />
        </>
      )}
    </section>
  )
}
