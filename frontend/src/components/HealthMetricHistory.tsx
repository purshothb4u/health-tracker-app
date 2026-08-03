import { useId } from 'react'
import type { HealthMetric } from '../types/HealthMetric'
import { formatLocalDate } from '../utils/dateFormatting'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { SectionHeader } from './ui/SectionHeader'

interface HealthMetricHistoryProps {
  metrics: HealthMetric[]
}

export default function HealthMetricHistory({ metrics }: HealthMetricHistoryProps) {
  const headingId = useId()

  return (
    <Card as="section" padding="normal" aria-labelledby={headingId}>
      <SectionHeader
        headingId={headingId}
        headingLevel={3}
        title="Weight history"
        description="Recorded weights are shown newest first."
      />

      {metrics.length === 0 ? (
        <EmptyState
          className="mt-4"
          compact
          title="No weight records yet"
          description="Save today's weight to begin the history."
        />
      ) : (
        <>
          <ul className="mt-4 space-y-3 md:hidden" aria-label="Weight history">
            {metrics.map((metric) => (
              <li key={metric.id} className="rounded-xl border border-app-border bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <time
                    dateTime={metric.metricDate}
                    className="font-semibold text-app-primary"
                  >
                    {formatLocalDate(metric.metricDate)}
                  </time>
                  <span className="font-semibold tabular-nums text-primary-700">
                    {metric.weightKg} kg
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-app-secondary">
                  {metric.notes || 'No notes'}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Weight history, newest record first</caption>
              <thead className="border-b border-app-border text-xs uppercase tracking-wide text-app-secondary">
                <tr>
                  <th scope="col" className="px-3 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Weight</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.id} className="border-b border-app-border last:border-0">
                    <td className="px-3 py-3 text-app-secondary">
                      <time dateTime={metric.metricDate}>{formatLocalDate(metric.metricDate)}</time>
                    </td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-app-primary">
                      {metric.weightKg} kg
                    </td>
                    <td className="max-w-md whitespace-pre-wrap break-words px-3 py-3 text-app-secondary">
                      {metric.notes || 'No notes'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
