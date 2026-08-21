import { useEffect, useState } from 'react'
import { useSleepTracking } from '../hooks/useSleepTracking'
import type { SleepEntry, SleepEntryRequest } from '../types/SleepTracking'
import { formatLocalDate } from '../utils/dateFormatting'
import DailySleepSummaryCard from './DailySleepSummaryCard'
import SleepEntryForm from './SleepEntryForm'
import SleepEntryHistory from './SleepEntryHistory'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'

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
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    setEditingEntry(null)
    setPendingDeleteEntryId(null)
    setActionError(null)
    setActionSuccess(null)
  }, [userProfileId])

  function handleSelectedDateChange(date: string) {
    setEditingEntry(null)
    setPendingDeleteEntryId(null)
    setActionError(null)
    setActionSuccess(null)
    setSelectedDate(date)
  }

  function beginAction() {
    setActionError(null)
    setActionSuccess(null)
  }

  async function handleCreate(data: SleepEntryRequest): Promise<SleepEntry> {
    beginAction()
    const entry = await createEntry(data)
    if (entry.sleepDate !== selectedDate) {
      setSelectedDate(entry.sleepDate)
    }
    setActionSuccess('Sleep entry added successfully.')
    return entry
  }

  async function handleUpdate(
    sleepEntryId: number,
    data: SleepEntryRequest,
  ): Promise<SleepEntry> {
    beginAction()
    const entry = await updateEntry(sleepEntryId, data)
    if (entry.sleepDate !== selectedDate) {
      setSelectedDate(entry.sleepDate)
    }
    setActionSuccess('Sleep entry updated successfully.')
    return entry
  }

  function handleEdit(entry: SleepEntry) {
    beginAction()
    setEditingEntry(entry)
  }

  async function handleDelete(sleepEntryId: number): Promise<void> {
    beginAction()
    setPendingDeleteEntryId(sleepEntryId)
  }

  async function confirmDelete(): Promise<void> {
    if (pendingDeleteEntryId === null) return
    const sleepEntryId = pendingDeleteEntryId
    beginAction()
    try {
      await deleteEntry(sleepEntryId)
      if (editingEntry?.id === sleepEntryId) {
        setEditingEntry(null)
      }
      setActionSuccess('Sleep entry deleted successfully.')
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete sleep entry.'))
    } finally {
      setPendingDeleteEntryId(null)
    }
  }

  const hasLoadedData = summary !== null || entries.length > 0
  const isInitialLoading = loading && !hasLoadedData
  const isRefreshing = loading && hasLoadedData

  return (
    <section className="min-w-0 space-y-5" aria-labelledby={`sleep-tracking-heading-${userProfileId}`}>
      <SectionHeader
        headingId={`sleep-tracking-heading-${userProfileId}`}
        headingLevel={2}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="sleep" size="large">
              <TrackingIcon name="sleep" />
            </IconContainer>
            <span className="break-words">Rest — Sleep</span>
          </span>
        )}
        description={`Review ${profileName}'s sleep sessions ending on ${formatLocalDate(selectedDate)}.`}
        actions={(
          <Field label="Sleep date" className="w-full sm:w-auto">
            {(controlProps) => (
              <input
                {...controlProps}
                className="min-h-11 w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto"
                disabled={mutating}
                max={getTodayLocalDate()}
                type="date"
                value={selectedDate}
                onChange={(event) => handleSelectedDateChange(event.target.value)}
              />
            )}
          </Field>
        )}
      />

      {isInitialLoading && <LoadingState message="Loading sleep tracking..." />}

      {isRefreshing && <LoadingState compact message="Refreshing sleep tracking..." />}

      {error && (
        <Alert
          tone="error"
          title="Unable to load sleep tracking"
          action={<Button variant="secondary" size="compact" disabled={mutating} onClick={reload}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert tone="error" title="Sleep action failed">
          {actionError}
        </Alert>
      )}

      {actionSuccess && (
        <Alert tone="success">
          {actionSuccess}
        </Alert>
      )}

      {hasLoadedData && (
        <>
          {summary && <DailySleepSummaryCard summary={summary} />}
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(21rem,0.92fr)_minmax(0,1.08fr)] xl:items-start">
            <SleepEntryForm
              editingEntry={editingEntry}
              mutating={mutating}
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
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteEntryId !== null}
        title="Delete sleep entry?"
        description="This sleep entry will be permanently removed from the selected day. This action cannot be undone."
        confirmLabel="Delete sleep entry"
        confirmingLabel="Deleting sleep entry..."
        confirming={mutating}
        onCancel={() => setPendingDeleteEntryId(null)}
        onConfirm={() => { void confirmDelete() }}
      />
    </section>
  )
}
