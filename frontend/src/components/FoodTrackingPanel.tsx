import { useEffect, useState } from 'react'
import FoodEntryForm from './FoodEntryForm'
import FoodEntryHistory from './FoodEntryHistory'
import DailyNutritionSummaryCard from './DailyNutritionSummaryCard'
import { useFoodEntries } from '../hooks/useFoodEntries'
import type { FoodEntry, FoodEntryRequest } from '../types/FoodEntry'
import type { UserProfile } from '../types/UserProfile'

interface FoodTrackingPanelProps {
  profile: UserProfile
}

function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function FoodTrackingPanel({ profile }: FoodTrackingPanelProps) {
  const {
    entries,
    summary,
    loading,
    mutating,
    error,
    selectedDate,
    setSelectedDate,
    create,
    update,
    remove,
  } = useFoodEntries(profile.id)
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setEditingEntry(null)
    setActionError(null)
  }, [selectedDate])

  async function handleDelete(foodEntryId: number) {
    if (!window.confirm('Delete this food entry?')) {
      return
    }

    setActionError(null)
    try {
      await remove(foodEntryId)
      if (editingEntry?.id === foodEntryId) {
        setEditingEntry(null)
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete food entry'))
    }
  }

  function handleEdit(entry: FoodEntry) {
    setActionError(null)
    setEditingEntry(entry)
  }

  async function handleCreate(data: FoodEntryRequest): Promise<FoodEntry> {
    return create(data)
  }

  async function handleUpdate(foodEntryId: number, data: FoodEntryRequest): Promise<FoodEntry> {
    return update(foodEntryId, data)
  }

  const isInitialLoading = loading && entries.length === 0 && summary === null

  return (
    <section className="space-y-4">
      <div className="px-1 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{profile.name}&apos;s food tracking</h3>
          <p className="mt-1 text-sm text-gray-500">Record meals and review daily nutrition.</p>
        </div>
        <label className="mt-3 block text-sm font-medium text-gray-700 sm:mt-0">
          Date
          <input
            className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            max={getTodayDate()}
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      {isInitialLoading && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600 shadow-sm">
          Loading food entries...
        </div>
      )}

      {!isInitialLoading && loading && (
        <p className="px-1 text-sm text-gray-500">Refreshing food entries...</p>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      {!isInitialLoading && (
        <>
          {summary && <DailyNutritionSummaryCard summary={summary} />}
          <FoodEntryForm
            editingEntry={editingEntry}
            mutating={mutating}
            selectedDate={selectedDate}
            onCancelEdit={() => setEditingEntry(null)}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
          />
          <FoodEntryHistory
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
