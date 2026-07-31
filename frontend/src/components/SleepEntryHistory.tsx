import { SLEEP_TYPE_LABELS, type SleepEntry } from '../types/SleepTracking'

interface SleepEntryHistoryProps {
  entries: SleepEntry[]
  mutating: boolean
  onEdit: (entry: SleepEntry) => void
  onDelete: (sleepEntryId: number) => Promise<void>
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) {
    return `${minutes} min`
  }
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`
}

function formatDateTime(value: string): string {
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime())
    ? 'Date and time not available'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(parsedDate)
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
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="text-base font-semibold text-gray-900">Sleep history</h4>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No sleep sessions recorded for this date.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    {SLEEP_TYPE_LABELS[entry.sleepType]}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatDuration(entry.durationMinutes)}
                  </p>
                  <p className="mt-1 break-words text-sm text-gray-600">
                    {formatDateTime(entry.startDateTime)} to {formatDateTime(entry.endDateTime)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Added {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-sm font-medium">
                  <button
                    className="min-h-10 text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={mutating}
                    type="button"
                    onClick={() => onEdit(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className="min-h-10 text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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

              <dl className="mt-3 text-xs">
                <div className="rounded-lg bg-white px-2 py-2">
                  <dt className="text-gray-500">Quality</dt>
                  <dd className="mt-1 font-semibold text-gray-900">
                    {formatQuality(entry.qualityRating)}
                  </dd>
                </div>
              </dl>

              {entry.notes && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-500">
                  {entry.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
