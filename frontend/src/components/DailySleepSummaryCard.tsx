import type { DailySleepSummary } from '../types/SleepTracking'
import { formatDurationMinutes, formatLocalDate } from '../utils/dateFormatting'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

interface DailySleepSummaryCardProps {
  summary: DailySleepSummary
}

function formatAverageQuality(averageQuality: number | null): string {
  return averageQuality === null
    ? 'Not available'
    : `${averageQuality.toLocaleString(undefined, { maximumFractionDigits: 2 })} / 5`
}

export default function DailySleepSummaryCard({ summary }: DailySleepSummaryCardProps) {
  return (
    <Card as="section" padding="normal" aria-labelledby={`sleep-summary-heading-${summary.userProfileId}`}>
      <SectionHeader
        headingId={`sleep-summary-heading-${summary.userProfileId}`}
        headingLevel={3}
        title="Daily sleep summary"
        description={`Backend-calculated totals for sessions ending on ${formatLocalDate(summary.sleepDate)}.`}
      />

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-primary-50 p-4">
          <dt className="text-app-secondary">Sessions</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {summary.sessionCount.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Total sleep</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatDurationMinutes(summary.totalSleepMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Night sleep</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatDurationMinutes(summary.nightSleepMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-app-secondary">Nap duration</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatDurationMinutes(summary.napMinutes)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
          <dt className="text-app-secondary">Average quality</dt>
          <dd className="mt-1 break-words text-lg font-bold text-app-primary">
            {formatAverageQuality(summary.averageQuality)}
          </dd>
          <p className="mt-1 text-xs text-app-secondary">Average of rated sessions only; unrated sessions are excluded.</p>
        </div>
      </dl>
    </Card>
  )
}
