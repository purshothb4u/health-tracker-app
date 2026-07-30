import { useEffect, useState } from 'react'
import { useWaterTracking } from '../hooks/useWaterTracking'
import type { WaterEntry, WaterEntryRequest, WaterGoal, WaterGoalRequest } from '../types/WaterTracking'
import HydrationSummaryCard from './HydrationSummaryCard'
import WaterEntryForm from './WaterEntryForm'
import WaterEntryHistory from './WaterEntryHistory'
import WaterGoalEditor from './WaterGoalEditor'
import WaterQuickAdd from './WaterQuickAdd'

interface WaterTrackingPanelProps {
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

export default function WaterTrackingPanel({ userProfileId, profileName }: WaterTrackingPanelProps) {
  const {
    selectedDate,
    setSelectedDate,
    entries,
    goal,
    summary,
    loading,
    mutating,
    error,
    reload,
    createEntry,
    updateEntry,
    deleteEntry,
    updateGoal,
  } = useWaterTracking(userProfileId)
  const [editingEntry, setEditingEntry] = useState<WaterEntry | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setEditingEntry(null)
    setActionError(null)
  }, [selectedDate, userProfileId])

  async function handleQuickAdd(amountMl: number): Promise<void> {
    setActionError(null)
    try {
      await createEntry({ entryDate: selectedDate, amountMl })
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to add water.'))
    }
  }

  async function handleDelete(waterEntryId: number): Promise<void> {
    if (!window.confirm('Delete this water entry?')) {
      return
    }

    setActionError(null)
    try {
      await deleteEntry(waterEntryId)
      if (editingEntry?.id === waterEntryId) {
        setEditingEntry(null)
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete water entry.'))
    }
  }

  function handleEdit(entry: WaterEntry) {
    setActionError(null)
    setEditingEntry(entry)
  }

  async function handleCreate(data: WaterEntryRequest): Promise<WaterEntry> {
    return createEntry(data)
  }

  async function handleUpdate(waterEntryId: number, data: WaterEntryRequest): Promise<WaterEntry> {
    return updateEntry(waterEntryId, data)
  }

  async function handleGoalUpdate(data: WaterGoalRequest): Promise<WaterGoal> {
    return updateGoal(data)
  }

  const hasLoadedData = summary !== null || goal !== null || entries.length > 0
  const isInitialLoading = loading && !hasLoadedData
  const isRefreshing = loading && hasLoadedData

  return (
    <section className="space-y-4" aria-labelledby={`water-tracking-heading-${userProfileId}`}>
      <div className="px-1 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h3 id={`water-tracking-heading-${userProfileId}`} className="text-lg font-semibold text-gray-900">
            {profileName}&apos;s water tracking
          </h3>
          <p className="mt-1 text-sm text-gray-500">Record water and review progress against your configured goal.</p>
        </div>
        <label className="mt-3 block text-sm font-medium text-gray-700 sm:mt-0">
          Date
          <input
            className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            max={getTodayLocalDate()}
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      {isInitialLoading && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600 shadow-sm" role="status">
          Loading water tracking...
        </div>
      )}

      {isRefreshing && <p className="px-1 text-sm text-gray-500" role="status">Refreshing water tracking...</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4" role="alert">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            disabled={mutating}
            type="button"
            onClick={reload}
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700" role="alert">
          {actionError}
        </div>
      )}

      {hasLoadedData && goal && (
        <>
          {summary && <HydrationSummaryCard summary={summary} />}
          <WaterGoalEditor goal={goal} mutating={mutating} onUpdateGoal={handleGoalUpdate} />
          <WaterQuickAdd mutating={mutating} onAdd={handleQuickAdd} />
          <WaterEntryForm
            editingEntry={editingEntry}
            mutating={mutating}
            selectedDate={selectedDate}
            onCancelEdit={() => setEditingEntry(null)}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
          />
          <WaterEntryHistory
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
