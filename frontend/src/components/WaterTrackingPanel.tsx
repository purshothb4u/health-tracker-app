import { useEffect, useState } from 'react'
import { useWaterTracking } from '../hooks/useWaterTracking'
import HydrationSummaryCard from './HydrationSummaryCard'
import TrackingIcon from './TrackingIcon'
import WaterQuickAdd from './WaterQuickAdd'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'

interface WaterTrackingPanelProps {
  userProfileId: number
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function WaterTrackingPanel({
  userProfileId,
}: WaterTrackingPanelProps) {
  const {
    selectedDate,
    goal,
    summary,
    loading,
    mutating,
    error,
    reload,
    createEntry,
  } = useWaterTracking(userProfileId)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
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

  const hasLoadedData = summary !== null || goal !== null
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
        <div className="min-w-0 space-y-4">
          {summary ? <HydrationSummaryCard summary={summary} /> : null}
          <WaterQuickAdd mutating={mutating} onAdd={handleQuickAdd} />
        </div>
      )}
    </section>
  )
}
