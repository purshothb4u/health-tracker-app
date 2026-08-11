import { useId } from 'react'
import type { HealthMetric } from '../types/HealthMetric'
import { formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'

interface HealthMetricHistoryProps {
  metrics: HealthMetric[]
}

export default function HealthMetricHistory({ metrics }: HealthMetricHistoryProps) {
  const headingId = useId()

  return (
    <Card as="section" padding="normal" aria-labelledby={headingId}>
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="primary">
          <TrackingIcon name="history" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId={headingId}
          headingLevel={3}
          title="Weight history"
          description="Recorded weights are shown newest first."
        />
      </div>

      {metrics.length === 0 ? (
        <EmptyState
          className="mt-4"
          compact
          icon={<TrackingIcon name="history" />}
          iconTone="primary"
          title="No weight records yet"
          description="Save today's weight to begin the history."
        />
      ) : (
        <>
          <ul className="mt-4 space-y-3 md:hidden" aria-label="Weight history">
            {metrics.map((metric) => (
              <li key={metric.id} className="rounded-card border border-app-border-muted bg-app-background/55 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <time
                    dateTime={metric.metricDate}
                    className="font-semibold text-app-primary"
                  >
                    {formatLocalDate(metric.metricDate)}
                  </time>
                  <span className="text-lg font-bold tabular-nums text-app-primary">
                    {metric.weightKg} kg
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-app-secondary">
                  {metric.notes || 'No notes'}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 hidden overflow-x-auto rounded-control border border-app-border-muted md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Weight history, newest record first</caption>
              <thead className="border-b border-app-border-muted bg-app-border-muted/55 text-metadata text-app-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Weight</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.id} className="border-b border-app-border-muted last:border-0">
                    <td className="px-4 py-4 text-app-secondary">
                      <time dateTime={metric.metricDate}>{formatLocalDate(metric.metricDate)}</time>
                    </td>
                    <td className="px-4 py-4 font-bold tabular-nums text-app-primary">
                      {metric.weightKg} kg
                    </td>
                    <td className="max-w-md whitespace-pre-wrap break-words px-4 py-4 text-app-secondary">
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
