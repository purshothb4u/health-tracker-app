import { useEffect, useState } from 'react'
import { useActivityTracking } from '../hooks/useActivityTracking'
import type { ActivityEntry, ActivityEntryRequest } from '../types/ActivityTracking'
import { formatLocalDate } from '../utils/dateFormatting'
import ActivityEntryForm from './ActivityEntryForm'
import ActivityEntryHistory from './ActivityEntryHistory'
import DailyActivitySummaryCard from './DailyActivitySummaryCard'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'

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
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    setEditingEntry(null)
    setPendingDeleteEntryId(null)
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
    beginAction()
    setPendingDeleteEntryId(activityEntryId)
  }

  async function confirmDelete(): Promise<void> {
    if (pendingDeleteEntryId === null) return
    const activityEntryId = pendingDeleteEntryId
    beginAction()
    try {
      await deleteEntry(activityEntryId)
      if (editingEntry?.id === activityEntryId) {
        setEditingEntry(null)
      }
      setActionSuccess('Activity deleted successfully.')
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete activity entry.'))
    } finally {
      setPendingDeleteEntryId(null)
    }
  }

  const hasLoadedData = summary !== null || entries.length > 0
  const isInitialLoading = loading && !hasLoadedData
  const isRefreshing = loading && hasLoadedData

  return (
    <section className="min-w-0 space-y-5" aria-labelledby={`activity-tracking-heading-${userProfileId}`}>
      <SectionHeader
        headingId={`activity-tracking-heading-${userProfileId}`}
        headingLevel={2}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="activity" size="large">
              <TrackingIcon name="activity" />
            </IconContainer>
            <span className="break-words">Move — Activity</span>
          </span>
        )}
        description={`Review ${profileName}'s recorded activity for ${formatLocalDate(selectedDate)}.`}
        actions={(
          <Field label="Activity date" className="w-full sm:w-auto">
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

      {isInitialLoading && <LoadingState message="Loading activity tracking..." />}

      {isRefreshing && <LoadingState compact message="Refreshing activity tracking..." />}

      {error && (
        <Alert
          tone="error"
          title="Unable to load activity tracking"
          action={<Button variant="secondary" size="compact" disabled={mutating} onClick={reload}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert tone="error" title="Activity action failed">
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
          {summary && <DailyActivitySummaryCard summary={summary} />}
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(21rem,0.92fr)_minmax(0,1.08fr)] xl:items-start">
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
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteEntryId !== null}
        title="Delete activity entry?"
        description="This activity entry will be permanently removed. This action cannot be undone."
        confirmLabel="Delete activity"
        confirmingLabel="Deleting activity..."
        confirming={mutating}
        onCancel={() => setPendingDeleteEntryId(null)}
        onConfirm={() => { void confirmDelete() }}
      />
    </section>
  )
}
