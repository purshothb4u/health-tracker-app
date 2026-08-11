import type { AnalyticsPreset } from '../hooks/useAnalytics'
import { formatAnalyticsDate } from '../utils/analyticsFormatting'
import TrackingIcon from './TrackingIcon'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'

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

function fieldErrors(rangeError: string | null): { from: string | null; to: string | null } {
  if (rangeError === null) {
    return { from: null, to: null }
  }
  if (rangeError.startsWith('From date')) {
    return { from: rangeError, to: null }
  }
  if (rangeError.startsWith('To date')) {
    return { from: null, to: rangeError }
  }
  return { from: null, to: rangeError }
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
  const errors = fieldErrors(rangeError)
  const inputClass = 'min-h-11 w-full min-w-0 max-w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm outline-none'

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      className="min-w-0 border-primary-100 bg-primary-50/30"
      aria-labelledby="analytics-range-heading"
    >
      <SectionHeader
        headingId="analytics-range-heading"
        headingLevel={3}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="primary">
              <TrackingIcon name="calendar" />
            </IconContainer>
            <span>Date range</span>
          </span>
        )}
        description={`${formatSelectedDate(fromDate)} to ${formatSelectedDate(toDate)}`}
      />

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Analytics date range presets">
        {presets.map((preset) => {
          const selected = selectedPreset === preset.value
          return (
            <Button
              key={preset.value}
              variant={selected ? 'primary' : 'secondary'}
              className="w-full sm:w-auto"
              aria-pressed={selected}
              onClick={() => onSelectPreset(preset.value)}
            >
              {preset.label}
            </Button>
          )
        })}
        <Button
          variant={selectedPreset === 'CUSTOM' ? 'primary' : 'secondary'}
          className="w-full sm:w-auto"
          aria-pressed={selectedPreset === 'CUSTOM'}
          onClick={onSelectCustom}
        >
          Custom range
        </Button>
      </div>

      {selectedPreset === 'CUSTOM' ? (
        <div className="mt-5 rounded-card border border-app-border-muted bg-app-surface/80 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Start date"
              required
              hint="First inclusive date in the analytics range."
              error={errors.from}
            >
              {(controlProps) => (
                <input
                  {...controlProps}
                  className={inputClass}
                  type="date"
                  value={fromDate}
                  onChange={(event) => onFromDateChange(event.target.value)}
                />
              )}
            </Field>
            <Field
              label="End date"
              required
              hint="Last inclusive date; future dates are not allowed."
              error={errors.to}
            >
              {(controlProps) => (
                <input
                  {...controlProps}
                  className={inputClass}
                  max={maxDate}
                  type="date"
                  value={toDate}
                  onChange={(event) => onToDateChange(event.target.value)}
                />
              )}
            </Field>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
