import { useId } from 'react'
import HealthMetricForm from './HealthMetricForm'
import HealthMetricHistory from './HealthMetricHistory'
import HealthSummaryCard from './HealthSummaryCard'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'
import { useHealthMetrics } from '../hooks/useHealthMetrics'
import type { UserProfile } from '../types/UserProfile'

interface HealthMetricsPanelProps {
  profile: UserProfile
  onMetricSaved: () => void
}

export default function HealthMetricsPanel({ profile, onMetricSaved }: HealthMetricsPanelProps) {
  const { metrics, summary, loading, error, reload } = useHealthMetrics(profile.id)
  const headingId = useId()
  const hasLoadedData = summary !== null || metrics.length > 0
  const initialLoading = loading && !hasLoadedData

  function handleMetricSaved() {
    reload()
    onMetricSaved()
  }

  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-5">
      <SectionHeader
        headingId={headingId}
        headingLevel={2}
        title="Weight and health metrics"
        description={`Record today's weight and review calculated health information for ${profile.name}.`}
      />

      {initialLoading ? <LoadingState message="Loading health metrics..." /> : null}

      {!initialLoading && loading ? (
        <LoadingState compact message="Refreshing health metrics..." />
      ) : null}

      {error ? (
        <Alert
          tone="error"
          title="Unable to load health metrics"
          action={(
            <Button variant="secondary" size="compact" onClick={reload}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      ) : null}

      {hasLoadedData ? (
        <>
          <div className="grid min-w-0 gap-5 xl:grid-cols-2 xl:items-start">
            {summary ? <HealthSummaryCard summary={summary} /> : null}
            <HealthMetricForm
              userProfileId={profile.id}
              metrics={metrics}
              onSaved={handleMetricSaved}
            />
          </div>
          <HealthMetricHistory metrics={metrics} />
        </>
      ) : null}
    </section>
  )
}
