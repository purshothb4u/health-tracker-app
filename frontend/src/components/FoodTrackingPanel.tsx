import { useEffect, useState } from 'react'
import FoodEntryForm from './FoodEntryForm'
import FoodEntryHistory from './FoodEntryHistory'
import DailyNutritionSummaryCard from './DailyNutritionSummaryCard'
import { useFoodEntries } from '../hooks/useFoodEntries'
import type { FoodEntry, FoodEntryRequest } from '../types/FoodEntry'
import type { DailyTargets } from '../types/DailyTargets'
import type { UserProfile } from '../types/UserProfile'
import { formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'

interface FoodTrackingPanelProps {
  profile: UserProfile
  dailyTargets: DailyTargets | null
  dailyTargetsLoading: boolean
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

export default function FoodTrackingPanel({
  profile,
  dailyTargets,
  dailyTargetsLoading,
}: FoodTrackingPanelProps) {
  const {
    entries,
    summary,
    loading,
    mutating,
    error,
    selectedDate,
    setSelectedDate,
    reload,
    create,
    update,
    remove,
  } = useFoodEntries(profile.id)
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null)
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    setEditingEntry(null)
    setPendingDeleteEntryId(null)
    setActionError(null)
    setSuccessMessage(null)
  }, [selectedDate, profile.id])

  async function handleDelete(foodEntryId: number) {
    setActionError(null)
    setSuccessMessage(null)
    setPendingDeleteEntryId(foodEntryId)
  }

  async function confirmDelete() {
    if (pendingDeleteEntryId === null) return
    const foodEntryId = pendingDeleteEntryId
    setActionError(null)
    setSuccessMessage(null)
    try {
      await remove(foodEntryId)
      if (editingEntry?.id === foodEntryId) {
        setEditingEntry(null)
      }
      setSuccessMessage('Food entry deleted.')
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete food entry'))
    } finally {
      setPendingDeleteEntryId(null)
    }
  }

  function handleEdit(entry: FoodEntry) {
    setActionError(null)
    setSuccessMessage(null)
    setEditingEntry(entry)
  }

  async function handleCreate(data: FoodEntryRequest): Promise<FoodEntry> {
    setActionError(null)
    setSuccessMessage(null)
    const createdEntry = await create(data)
    setSuccessMessage('Food entry added.')
    return createdEntry
  }

  async function handleUpdate(foodEntryId: number, data: FoodEntryRequest): Promise<FoodEntry> {
    setActionError(null)
    setSuccessMessage(null)
    const updatedEntry = await update(foodEntryId, data)
    setSuccessMessage('Food entry updated.')
    return updatedEntry
  }

  const isInitialLoading = loading && entries.length === 0 && summary === null
  const hasLoadedData = summary !== null

  return (
    <section className="min-w-0 space-y-5" aria-labelledby={`food-tracking-heading-${profile.id}`}>
      <SectionHeader
        headingId={`food-tracking-heading-${profile.id}`}
        headingLevel={2}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="nutrition" size="large">
              <TrackingIcon name="nutrition" />
            </IconContainer>
            <span className="break-words">Food and nutrition</span>
          </span>
        )}
        description={`Review ${profile.displayName}'s totals and food history for ${formatLocalDate(selectedDate)}.`}
        actions={(
          <Field label="Food date" className="w-full sm:w-auto">
            {(controlProps) => (
              <input
                {...controlProps}
                className="min-h-11 w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
                disabled={mutating}
                max={getTodayDate()}
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            )}
          </Field>
        )}
      />

      {isInitialLoading && <LoadingState message="Loading food entries..." />}

      {!isInitialLoading && loading && (
        <LoadingState compact message="Refreshing food entries..." />
      )}

      {error && (
        <Alert
          tone="error"
          title="Unable to load food tracking"
          action={(
            <Button variant="secondary" size="compact" disabled={mutating} onClick={reload}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert tone="error" title="Food action failed">
          {actionError}
        </Alert>
      )}

      {successMessage && <Alert tone="success">{successMessage}</Alert>}

      {hasLoadedData && (
        <>
          {summary && (
            <DailyNutritionSummaryCard
              dailyTargets={dailyTargets}
              dailyTargetsLoading={dailyTargetsLoading}
              entryCount={entries.length}
              summary={summary}
            />
          )}
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] xl:items-start">
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
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteEntryId !== null}
        title="Delete food entry?"
        description="This food entry will be permanently removed from the selected day. This action cannot be undone."
        confirmLabel="Delete food entry"
        confirmingLabel="Deleting food entry..."
        confirming={mutating}
        onCancel={() => setPendingDeleteEntryId(null)}
        onConfirm={() => { void confirmDelete() }}
      />
    </section>
  )
}
