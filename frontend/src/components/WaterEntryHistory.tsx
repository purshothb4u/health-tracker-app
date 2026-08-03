import type { WaterEntry } from '../types/WaterTracking'
import { formatLocalDateTime } from '../utils/dateFormatting'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
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
      <SectionHeader
        headingId="water-history-heading"
        headingLevel={3}
        title="Water history"
        description="Entries are shown in the order they were recorded."
      />

      {entries.length === 0 ? (
        <EmptyState
          className="mt-5"
          compact
          title="No water logged"
          description="No water entries were recorded for this date."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="min-w-0 rounded-xl border border-app-border bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-app-primary">{formatAmount(entry.amountMl)}</p>
                  <p className="mt-1 text-sm text-app-secondary">Added {formatLocalDateTime(entry.createdAt)}</p>
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
