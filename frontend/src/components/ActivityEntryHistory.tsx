import {
  ACTIVITY_CATEGORY_LABELS,
  type ActivityEntry,
} from '../types/ActivityTracking'

interface ActivityEntryHistoryProps {
  entries: ActivityEntry[]
  mutating: boolean
  onEdit: (entry: ActivityEntry) => void
  onDelete: (activityEntryId: number) => Promise<void>
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) {
    return `${minutes} min`
  }
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`
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

function formatCreatedTime(createdAt: string): string {
  const parsedDate = new Date(createdAt)
  return Number.isNaN(parsedDate.getTime())
    ? 'Time not available'
    : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(parsedDate)
}

export default function ActivityEntryHistory({
  entries,
  mutating,
  onEdit,
  onDelete,
}: ActivityEntryHistoryProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="text-base font-semibold text-gray-900">Activity history</h4>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No activities recorded for this date.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    {ACTIVITY_CATEGORY_LABELS[entry.category]}
                  </p>
                  <p className="mt-1 break-words font-semibold text-gray-900">{entry.activityName}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatDuration(entry.durationMinutes)} · Added at {formatCreatedTime(entry.createdAt)}
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

              <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg bg-white px-2 py-2">
                  <dt className="text-gray-500">Reported steps</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{formatSteps(entry.steps)}</dd>
                </div>
                <div className="rounded-lg bg-white px-2 py-2">
                  <dt className="text-gray-500">Reported distance</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{formatDistance(entry.distanceKm)}</dd>
                </div>
                <div className="rounded-lg bg-white px-2 py-2">
                  <dt className="text-gray-500">Reported calories</dt>
                  <dd className="mt-1 font-semibold text-gray-900">
                    {formatReportedCalories(entry.reportedCaloriesBurned)}
                  </dd>
                </div>
              </dl>

              {entry.notes && <p className="mt-3 break-words text-sm text-gray-500">{entry.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
