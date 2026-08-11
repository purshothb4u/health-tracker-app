import { SLEEP_TYPE_LABELS, type SleepEntry } from '../types/SleepTracking'
import { formatDurationMinutes, formatLocalDateTime } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { IconContainer } from './ui/IconContainer'
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
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="sleep">
          <TrackingIcon name="history" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId="sleep-history-heading"
          headingLevel={3}
          title="Sleep history"
          description="Durations are calculated by the backend from the recorded start and end times."
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          className="mt-5"
          compact
          icon={<TrackingIcon name="sleep" />}
          iconTone="sleep"
          title="No sleep logged"
          description="No sleep sessions were recorded for this date."
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
                  <IconContainer aria-hidden="true" tone="sleep" size="small">
                    <TrackingIcon name="sleep" />
                  </IconContainer>
                  <div className="min-w-0">
                    <StatusBadge tone="sleep">{SLEEP_TYPE_LABELS[entry.sleepType]}</StatusBadge>
                    <h4 className="mt-2 break-words text-card-title tabular-nums text-app-primary">
                      {formatDurationMinutes(entry.durationMinutes)}
                    </h4>
                    <p className="mt-1 break-words text-metadata text-app-secondary">
                      Added {formatLocalDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions for ${SLEEP_TYPE_LABELS[entry.sleepType]} session`}>
                  <Button variant="secondary" disabled={mutating} onClick={() => onEdit(entry)}>
                    Edit
                  </Button>
                  <Button variant="destructive" disabled={mutating} onClick={() => { void onDelete(entry.id) }}>
                    Delete
                  </Button>
                </div>
              </div>

              <dl className="mt-4 grid min-w-0 grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface px-3 py-2.5">
                  <dt className="text-metadata text-app-secondary">Start</dt>
                  <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">
                    <time dateTime={entry.startDateTime}>{formatLocalDateTime(entry.startDateTime)}</time>
                  </dd>
                </div>
                <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface px-3 py-2.5">
                  <dt className="text-metadata text-app-secondary">End</dt>
                  <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">
                    <time dateTime={entry.endDateTime}>{formatLocalDateTime(entry.endDateTime)}</time>
                  </dd>
                </div>
                <div className="min-w-0 rounded-control border border-app-border-muted bg-app-surface px-3 py-2.5 min-[390px]:col-span-2">
                  <dt className="text-metadata text-app-secondary">Quality rating</dt>
                  <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-app-primary">
                    {formatQuality(entry.qualityRating)}
                  </dd>
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
