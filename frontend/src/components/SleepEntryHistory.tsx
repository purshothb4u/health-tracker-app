import { SLEEP_TYPE_LABELS, type SleepEntry } from '../types/SleepTracking'
import { formatDurationMinutes, formatLocalDateTime } from '../utils/dateFormatting'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface SleepEntryHistoryProps {
  entries: SleepEntry[]
  mutating: boolean
  onEdit: (entry: SleepEntry) => void
  onDelete: (sleepEntryId: number) => Promise<void>
}

function formatQuality(qualityRating: number | null): string {
  return qualityRating === null ? 'Not available' : `${qualityRating} / 5`
}

export default function SleepEntryHistory({
  entries,
  mutating,
  onEdit,
  onDelete,
}: SleepEntryHistoryProps) {
  return (
    <Card as="section" padding="normal" aria-labelledby="sleep-history-heading">
      <SectionHeader
        headingId="sleep-history-heading"
        headingLevel={3}
        title="Sleep history"
        description="Durations are calculated by the backend from the recorded start and end times."
      />

      {entries.length === 0 ? (
        <EmptyState
          className="mt-5"
          compact
          title="No sleep logged"
          description="No sleep sessions were recorded for this date."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="min-w-0 rounded-xl border border-app-border bg-slate-50 p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <StatusBadge tone="information">{SLEEP_TYPE_LABELS[entry.sleepType]}</StatusBadge>
                  <p className="mt-2 font-semibold text-app-primary">{formatDurationMinutes(entry.durationMinutes)}</p>
                  <p className="mt-1 break-words text-sm text-app-secondary">
                    {formatLocalDateTime(entry.startDateTime)} to {formatLocalDateTime(entry.endDateTime)}
                  </p>
                  <p className="mt-1 break-words text-xs text-app-secondary">
                    Added {formatLocalDateTime(entry.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={mutating} onClick={() => onEdit(entry)}>
                    Edit
                  </Button>
                  <Button variant="destructive" disabled={mutating} onClick={() => { void onDelete(entry.id) }}>
                    Delete
                  </Button>
                </div>
              </div>

              <dl className="mt-3 text-xs">
                <div className="rounded-lg bg-app-surface px-3 py-2">
                  <dt className="text-app-secondary">Quality rating</dt>
                  <dd className="mt-1 font-semibold text-app-primary">{formatQuality(entry.qualityRating)}</dd>
                </div>
              </dl>

              {entry.notes ? (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-app-secondary">{entry.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}
