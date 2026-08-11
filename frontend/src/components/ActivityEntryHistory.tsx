import {
  ACTIVITY_CATEGORY_LABELS,
  type ActivityEntry,
} from '../types/ActivityTracking'
import { formatDurationMinutes, formatLocalDateTime } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { IconContainer } from './ui/IconContainer'
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
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="activity">
          <TrackingIcon name="history" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId="activity-history-heading"
          headingLevel={3}
          title="Activity history"
          description="Optional values appear as Not available when they were not supplied."
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          className="mt-5"
          compact
          icon={<TrackingIcon name="activity" />}
          iconTone="activity"
          title="No activity logged"
          description="No activity entries were recorded for this date."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="min-w-0 rounded-card border border-app-border-muted bg-app-background/55 p-4"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <IconContainer aria-hidden="true" tone="activity" size="small">
                    <TrackingIcon name="activity" />
                  </IconContainer>
                  <div className="min-w-0">
                    <StatusBadge tone="activity">{ACTIVITY_CATEGORY_LABELS[entry.category]}</StatusBadge>
                    <h4 className="mt-2 break-words text-card-title text-app-primary">{entry.activityName}</h4>
                    <p className="mt-1 break-words text-supporting text-app-secondary">
                      {formatDurationMinutes(entry.durationMinutes)} &middot; Added {formatLocalDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions for ${entry.activityName}`}>
                  <Button variant="secondary" disabled={mutating} onClick={() => onEdit(entry)}>
                    Edit
                  </Button>
                  <Button variant="destructive" disabled={mutating} onClick={() => { void onDelete(entry.id) }}>
                    Delete
                  </Button>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-control border border-app-border-muted bg-app-surface px-3 py-2.5">
                  <dt className="text-metadata text-app-secondary">Reported steps</dt>
                  <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">{formatSteps(entry.steps)}</dd>
                </div>
                <div className="rounded-control border border-app-border-muted bg-app-surface px-3 py-2.5">
                  <dt className="text-metadata text-app-secondary">Reported distance</dt>
                  <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">{formatDistance(entry.distanceKm)}</dd>
                </div>
                <div className="rounded-control border border-app-border-muted bg-app-surface px-3 py-2.5">
                  <dt className="text-metadata text-app-secondary">Reported calories</dt>
                  <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">{formatReportedCalories(entry.reportedCaloriesBurned)}</dd>
                </div>
              </dl>

              {entry.notes ? (
                <p className="mt-3 whitespace-pre-wrap break-words text-supporting text-app-secondary">{entry.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}
