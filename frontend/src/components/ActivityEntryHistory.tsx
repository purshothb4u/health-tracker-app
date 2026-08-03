import {
  ACTIVITY_CATEGORY_LABELS,
  type ActivityEntry,
} from '../types/ActivityTracking'
import { formatDurationMinutes, formatLocalDateTime } from '../utils/dateFormatting'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface ActivityEntryHistoryProps {
  entries: ActivityEntry[]
  mutating: boolean
  onEdit: (entry: ActivityEntry) => void
  onDelete: (activityEntryId: number) => Promise<void>
}

function formatSteps(steps: number | null): string {
  return steps === null ? 'Not available' : `${steps.toLocaleString()} steps`
}

function formatDistance(distanceKm: number | null): string {
  return distanceKm === null
    ? 'Not available'
    : `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 3 })} km`
}

function formatReportedCalories(calories: number | null): string {
  return calories === null ? 'Not available' : `${calories.toLocaleString()} kcal reported`
}

export default function ActivityEntryHistory({
  entries,
  mutating,
  onEdit,
  onDelete,
}: ActivityEntryHistoryProps) {
  return (
    <Card as="section" padding="normal" aria-labelledby="activity-history-heading">
      <SectionHeader
        headingId="activity-history-heading"
        headingLevel={3}
        title="Activity history"
        description="Optional values appear as Not available when they were not supplied."
      />

      {entries.length === 0 ? (
        <EmptyState
          className="mt-5"
          compact
          title="No activity logged"
          description="No activity entries were recorded for this date."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="min-w-0 rounded-xl border border-app-border bg-slate-50 p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <StatusBadge tone="information">{ACTIVITY_CATEGORY_LABELS[entry.category]}</StatusBadge>
                  <p className="mt-2 break-words font-semibold text-app-primary">{entry.activityName}</p>
                  <p className="mt-1 break-words text-sm text-app-secondary">
                    {formatDurationMinutes(entry.durationMinutes)} · Added {formatLocalDateTime(entry.createdAt)}
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

              <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg bg-app-surface px-2 py-2">
                  <dt className="text-app-secondary">Reported steps</dt>
                  <dd className="mt-1 break-words font-semibold text-app-primary">{formatSteps(entry.steps)}</dd>
                </div>
                <div className="rounded-lg bg-app-surface px-2 py-2">
                  <dt className="text-app-secondary">Reported distance</dt>
                  <dd className="mt-1 break-words font-semibold text-app-primary">{formatDistance(entry.distanceKm)}</dd>
                </div>
                <div className="rounded-lg bg-app-surface px-2 py-2">
                  <dt className="text-app-secondary">Reported calories</dt>
                  <dd className="mt-1 break-words font-semibold text-app-primary">{formatReportedCalories(entry.reportedCaloriesBurned)}</dd>
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
