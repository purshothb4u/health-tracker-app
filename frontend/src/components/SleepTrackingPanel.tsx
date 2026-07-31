import { useEffect, useState } from 'react'
import { useSleepTracking } from '../hooks/useSleepTracking'
import type { SleepEntry, SleepEntryRequest } from '../types/SleepTracking'
import DailySleepSummaryCard from './DailySleepSummaryCard'
import SleepEntryForm from './SleepEntryForm'
import SleepEntryHistory from './SleepEntryHistory'

interface SleepTrackingPanelProps {
  userProfileId: number
  profileName: string
}

function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function SleepTrackingPanel({
  userProfileId,
  profileName,
}: SleepTrackingPanelProps) {
  const {
    selectedDate,
    setSelectedDate,
    entries,
    summary,
    loading,
    mutating,
    error,
    reload,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useSleepTracking(userProfileId)
  const [editingEntry, setEditingEntry] = useState<SleepEntry | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    setEditingEntry(null)
    setActionError(null)
    setActionSuccess(null)
  }, [selectedDate, userProfileId])

  function beginAction() {
    setActionError(null)
    setActionSuccess(null)
  }

  async function handleCreate(data: SleepEntryRequest): Promise<SleepEntry> {
    beginAction()
    const entry = await createEntry(data)
    setActionSuccess('Sleep entry added successfully.')
    return entry
  }

  async function handleUpdate(
    sleepEntryId: number,
    data: SleepEntryRequest,
  ): Promise<SleepEntry> {
    beginAction()
    const entry = await updateEntry(sleepEntryId, data)
    setActionSuccess('Sleep entry updated successfully.')
    return entry
  }

  function handleEdit(entry: SleepEntry) {
    beginAction()
    setEditingEntry(entry)
  }

  async function handleDelete(sleepEntryId: number): Promise<void> {
    if (!window.confirm('Delete this sleep entry?')) {
      return
    }

    beginAction()
    try {
      await deleteEntry(sleepEntryId)
      if (editingEntry?.id === sleepEntryId) {
        setEditingEntry(null)
      }
      setActionSuccess('Sleep entry deleted successfully.')
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete sleep entry.'))
    }
  }

  const hasLoadedData = summary !== null || entries.length > 0
  const isInitialLoading = loading && !hasLoadedData
  const isRefreshing = loading && hasLoadedData

  return (
    <section className="min-w-0 space-y-4" aria-labelledby={`sleep-tracking-heading-${userProfileId}`}>
      <div className="px-1 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3
            id={`sleep-tracking-heading-${userProfileId}`}
            className="text-lg font-semibold text-gray-900"
          >
            {profileName}&apos;s sleep tracking
          </h3>
          <p className="mt-1 text-sm text-gray-500">Record sleep sessions and review daily totals.</p>
        </div>
        <label className="mt-3 block text-sm font-medium text-gray-700 sm:mt-0">
          Date
          <input
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:w-auto"
            disabled={mutating}
            max={getTodayLocalDate()}
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      {isInitialLoading && (
        <div
          className="rounded-2xl border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600 shadow-sm"
          role="status"
        >
          Loading sleep tracking...
        </div>
      )}

      {isRefreshing && (
        <p className="px-1 text-sm text-gray-500" role="status">
          Refreshing sleep tracking...
        </p>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4" role="alert">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutating}
            type="button"
            onClick={reload}
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div
          className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium text-green-700"
          role="status"
        >
          {actionSuccess}
        </div>
      )}

      {hasLoadedData && (
        <>
          {summary && <DailySleepSummaryCard summary={summary} />}
          <SleepEntryForm
            editingEntry={editingEntry}
            mutating={mutating}
            selectedDate={selectedDate}
            onActionStart={beginAction}
            onCancelEdit={() => setEditingEntry(null)}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
          />
          <SleepEntryHistory
            entries={entries}
            mutating={mutating}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </>
      )}
    </section>
  )
}
