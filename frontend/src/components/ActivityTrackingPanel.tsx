import { useEffect, useState } from 'react'
import { useActivityTracking } from '../hooks/useActivityTracking'
import type { ActivityEntry, ActivityEntryRequest } from '../types/ActivityTracking'
import ActivityEntryForm from './ActivityEntryForm'
import ActivityEntryHistory from './ActivityEntryHistory'
import DailyActivitySummaryCard from './DailyActivitySummaryCard'

interface ActivityTrackingPanelProps {
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

export default function ActivityTrackingPanel({
  userProfileId,
  profileName,
}: ActivityTrackingPanelProps) {
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
  } = useActivityTracking(userProfileId)
  const [editingEntry, setEditingEntry] = useState<ActivityEntry | null>(null)
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

  async function handleCreate(data: ActivityEntryRequest): Promise<ActivityEntry> {
    beginAction()
    const entry = await createEntry(data)
    setActionSuccess('Activity added successfully.')
    return entry
  }

  async function handleUpdate(
    activityEntryId: number,
    data: ActivityEntryRequest,
  ): Promise<ActivityEntry> {
    beginAction()
    const entry = await updateEntry(activityEntryId, data)
    setActionSuccess('Activity updated successfully.')
    return entry
  }

  function handleEdit(entry: ActivityEntry) {
    beginAction()
    setEditingEntry(entry)
  }

  async function handleDelete(activityEntryId: number): Promise<void> {
    if (!window.confirm('Delete this activity entry?')) {
      return
    }

    beginAction()
    try {
      await deleteEntry(activityEntryId)
      if (editingEntry?.id === activityEntryId) {
        setEditingEntry(null)
      }
      setActionSuccess('Activity deleted successfully.')
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete activity entry.'))
    }
  }

  const hasLoadedData = summary !== null || entries.length > 0
  const isInitialLoading = loading && !hasLoadedData
  const isRefreshing = loading && hasLoadedData

  return (
    <section className="min-w-0 space-y-4" aria-labelledby={`activity-tracking-heading-${userProfileId}`}>
      <div className="px-1 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3
            id={`activity-tracking-heading-${userProfileId}`}
            className="text-lg font-semibold text-gray-900"
          >
            {profileName}&apos;s exercise and activity tracking
          </h3>
          <p className="mt-1 text-sm text-gray-500">Record activities and review user-reported daily totals.</p>
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
          Loading activity tracking...
        </div>
      )}

      {isRefreshing && (
        <p className="px-1 text-sm text-gray-500" role="status">
          Refreshing activity tracking...
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
          {summary && <DailyActivitySummaryCard summary={summary} />}
          <ActivityEntryForm
            editingEntry={editingEntry}
            mutating={mutating}
            selectedDate={selectedDate}
            onActionStart={beginAction}
            onCancelEdit={() => setEditingEntry(null)}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
          />
          <ActivityEntryHistory
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
