import type { WaterEntry } from '../types/WaterTracking'

interface WaterEntryHistoryProps {
  entries: WaterEntry[]
  mutating: boolean
  onEdit: (entry: WaterEntry) => void
  onDelete: (waterEntryId: number) => Promise<void>
}

function formatAmount(amountMl: number): string {
  const millilitres = `${amountMl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ml`
  if (amountMl < 1000) {
    return millilitres
  }
  return `${millilitres} (${(amountMl / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} L)`
}

function formatCreatedTime(createdAt: string): string {
  const parsedDate = new Date(createdAt)
  return Number.isNaN(parsedDate.getTime())
    ? 'Time not available'
    : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(parsedDate)
}

export default function WaterEntryHistory({ entries, mutating, onEdit, onDelete }: WaterEntryHistoryProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="text-base font-semibold text-gray-900">Water history</h4>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No water entries for this date.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{formatAmount(entry.amountMl)}</p>
                  <p className="mt-1 text-sm text-gray-600">Added at {formatCreatedTime(entry.createdAt)}</p>
                </div>
                <div className="flex gap-3 text-sm font-medium">
                  <button
                    className="text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={mutating}
                    type="button"
                    onClick={() => onEdit(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={mutating}
                    type="button"
                    onClick={() => {
                      void onDelete(entry.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {entry.notes && <p className="mt-3 text-sm text-gray-500">{entry.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
