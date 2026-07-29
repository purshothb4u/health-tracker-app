import type { AnalyticsPreset } from '../hooks/useAnalytics'
import { formatAnalyticsDate } from '../utils/analyticsFormatting'

interface AnalyticsDateRangeSelectorProps {
  fromDate: string
  toDate: string
  selectedPreset: AnalyticsPreset
  rangeError: string | null
  onSelectPreset: (preset: Exclude<AnalyticsPreset, 'CUSTOM'>) => void
  onSelectCustom: () => void
  onFromDateChange: (date: string) => void
  onToDateChange: (date: string) => void
}

const presets: Array<{ value: Exclude<AnalyticsPreset, 'CUSTOM'>; label: string }> = [
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'LAST_90_DAYS', label: 'Last 90 days' },
]

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatSelectedDate(date: string): string {
  return date ? formatAnalyticsDate(date) : 'Select a date'
}

export default function AnalyticsDateRangeSelector({
  fromDate,
  toDate,
  selectedPreset,
  rangeError,
  onSelectPreset,
  onSelectCustom,
  onFromDateChange,
  onToDateChange,
}: AnalyticsDateRangeSelectorProps) {
  const maxDate = formatLocalDate(new Date())

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="analytics-range-heading">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 id="analytics-range-heading" className="text-base font-semibold text-gray-900">
            Date range
          </h4>
          <p className="text-sm text-gray-500">
            {formatSelectedDate(fromDate)} to {formatSelectedDate(toDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Analytics date range presets">
        {presets.map((preset) => (
          <button
            key={preset.value}
            className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              selectedPreset === preset.value
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:text-primary-700'
            }`}
            type="button"
            onClick={() => onSelectPreset(preset.value)}
          >
            {preset.label}
          </button>
        ))}
        <button
          className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            selectedPreset === 'CUSTOM'
              ? 'bg-primary-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:text-primary-700'
          }`}
          type="button"
          onClick={onSelectCustom}
        >
          Custom
        </button>
      </div>

      {selectedPreset === 'CUSTOM' && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            From date
            <input
              className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            To date
            <input
              className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              max={maxDate}
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
            />
          </label>
        </div>
      )}

      {rangeError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {rangeError}
        </p>
      )}
    </section>
  )
}
