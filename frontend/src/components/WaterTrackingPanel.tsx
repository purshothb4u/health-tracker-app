import { useEffect, useState } from 'react'
import { useWaterTracking } from '../hooks/useWaterTracking'
import type { DailyTargets } from '../types/DailyTargets'
import type { WaterEntry, WaterEntryRequest, WaterGoal, WaterGoalRequest } from '../types/WaterTracking'
import { formatLocalDate } from '../utils/dateFormatting'
import HydrationSummaryCard from './HydrationSummaryCard'
import TrackingIcon from './TrackingIcon'
import WaterEntryForm from './WaterEntryForm'
import WaterEntryHistory from './WaterEntryHistory'
import WaterGoalEditor from './WaterGoalEditor'
import WaterQuickAdd from './WaterQuickAdd'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'

interface WaterTrackingPanelProps {
  userProfileId: number
  profileName: string
  dailyTargets: DailyTargets | null
  dailyTargetsLoading: boolean
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

export default function WaterTrackingPanel({
  userProfileId,
  profileName,
  dailyTargets,
  dailyTargetsLoading,
}: WaterTrackingPanelProps) {
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
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    setEditingEntry(null)
    setPendingDeleteEntryId(null)
    setActionError(null)
    setSuccessMessage(null)
  }, [selectedDate, userProfileId])

  async function handleQuickAdd(amountMl: number): Promise<void> {
    setActionError(null)
    setSuccessMessage(null)
    try {
      await createEntry({ entryDate: selectedDate, amountMl })
      setSuccessMessage(`${amountMl.toLocaleString()} ml added.`)
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to add water.'))
    }
  }

  async function handleDelete(waterEntryId: number): Promise<void> {
    setActionError(null)
    setSuccessMessage(null)
    setPendingDeleteEntryId(waterEntryId)
  }

  async function confirmDelete(): Promise<void> {
    if (pendingDeleteEntryId === null) return
    const waterEntryId = pendingDeleteEntryId
    setActionError(null)
    setSuccessMessage(null)
    try {
      await deleteEntry(waterEntryId)
      if (editingEntry?.id === waterEntryId) {
        setEditingEntry(null)
      }
      setSuccessMessage('Water entry deleted.')
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete water entry.'))
    } finally {
      setPendingDeleteEntryId(null)
    }
  }

  function handleEdit(entry: WaterEntry) {
    setActionError(null)
    setSuccessMessage(null)
    setEditingEntry(entry)
  }

  async function handleCreate(data: WaterEntryRequest): Promise<WaterEntry> {
    setActionError(null)
    setSuccessMessage(null)
    const createdEntry = await createEntry(data)
    setSuccessMessage('Water entry added.')
    return createdEntry
  }

  async function handleUpdate(waterEntryId: number, data: WaterEntryRequest): Promise<WaterEntry> {
    setActionError(null)
    setSuccessMessage(null)
    const updatedEntry = await updateEntry(waterEntryId, data)
    setSuccessMessage('Water entry updated.')
    return updatedEntry
  }

  async function handleGoalUpdate(data: WaterGoalRequest): Promise<WaterGoal> {
    setActionError(null)
    setSuccessMessage(null)
    const updatedGoal = await updateGoal(data)
    setSuccessMessage('Daily water goal saved.')
    return updatedGoal
  }

  const hasLoadedData = summary !== null || goal !== null || entries.length > 0
  const isInitialLoading = loading && !hasLoadedData
  const isRefreshing = loading && hasLoadedData

  return (
    <section className="min-w-0 space-y-5" aria-labelledby={`water-tracking-heading-${userProfileId}`}>
      <SectionHeader
        headingId={`water-tracking-heading-${userProfileId}`}
        headingLevel={2}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="hydration" size="large">
              <TrackingIcon name="hydration" />
            </IconContainer>
            <span className="break-words">Hydration</span>
          </span>
        )}
        description={`Review ${profileName}'s hydration for ${formatLocalDate(selectedDate)} using the current configured goal.`}
        actions={(
          <Field label="Water date" className="w-full sm:w-auto">
            {(controlProps) => (
              <input
                {...controlProps}
                className="min-h-11 w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
                disabled={mutating}
                max={getTodayLocalDate()}
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            )}
          </Field>
        )}
      />

      {isInitialLoading && <LoadingState message="Loading water tracking..." />}

      {isRefreshing && <LoadingState compact message="Refreshing water tracking..." />}

      {error && (
        <Alert
          tone="error"
          title="Unable to load water tracking"
          action={<Button variant="secondary" size="compact" disabled={mutating} onClick={reload}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert tone="error" title="Water action failed">
          {actionError}
        </Alert>
      )}

      {successMessage && <Alert tone="success">{successMessage}</Alert>}

      {hasLoadedData && goal && (
        <>
          {summary && (
            <HydrationSummaryCard
              dailyTargets={dailyTargets}
              dailyTargetsLoading={dailyTargetsLoading}
              summary={summary}
            />
          )}
          <div className="grid min-w-0 gap-5 xl:grid-cols-2 xl:items-start">
            <WaterGoalEditor goal={goal} mutating={mutating} onUpdateGoal={handleGoalUpdate} />
            <WaterQuickAdd mutating={mutating} onAdd={handleQuickAdd} />
          </div>
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)] xl:items-start">
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
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteEntryId !== null}
        title="Delete water entry?"
        description="This water entry will be permanently removed from the selected day. This action cannot be undone."
        confirmLabel="Delete water entry"
        confirmingLabel="Deleting water entry..."
        confirming={mutating}
        onCancel={() => setPendingDeleteEntryId(null)}
        onConfirm={() => { void confirmDelete() }}
      />
    </section>
  )
}
