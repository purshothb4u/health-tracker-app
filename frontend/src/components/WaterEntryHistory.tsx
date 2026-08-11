import type { WaterEntry } from '../types/WaterTracking'
import { formatLocalDateTime } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'

interface WaterEntryHistoryProps {
  entries: WaterEntry[]
  mutating: boolean
  onEdit: (entry: WaterEntry) => void
  onDelete: (waterEntryId: number) => Promise<void>
}

function formatAmount(amountMl: number): string {
  const millilitres = `${amountMl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ml`
  if (amountMl < 1000) return millilitres
  return `${millilitres} (${(amountMl / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} L)`
}

export default function WaterEntryHistory({ entries, mutating, onEdit, onDelete }: WaterEntryHistoryProps) {
  return (
    <Card as="section" padding="normal" aria-labelledby="water-history-heading">
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="hydration">
          <TrackingIcon name="history" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId="water-history-heading"
          headingLevel={3}
          title="Water history"
          description="Entries are shown in the order they were recorded."
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          className="mt-5"
          compact
          icon={<TrackingIcon name="hydration" />}
          iconTone="hydration"
          title="No water logged"
          description="No water entries were recorded for this date."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="min-w-0 rounded-card border border-app-border-muted bg-app-background/55 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <IconContainer aria-hidden="true" tone="hydration" size="small">
                    <TrackingIcon name="hydration" />
                  </IconContainer>
                  <div className="min-w-0">
                    <h4 className="break-words text-card-title tabular-nums text-app-primary">
                      {formatAmount(entry.amountMl)}
                    </h4>
                    <p className="mt-1 break-words text-metadata text-app-secondary">
                      Added {formatLocalDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={mutating} onClick={() => onEdit(entry)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={mutating}
                    onClick={() => { void onDelete(entry.id) }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
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
