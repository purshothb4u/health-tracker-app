import HealthMetricForm from './HealthMetricForm'
import HealthMetricHistory from './HealthMetricHistory'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { LoadingState } from './ui/LoadingState'
import { useHealthMetrics } from '../hooks/useHealthMetrics'
import type { UserProfile } from '../types/UserProfile'

interface HealthMetricsPanelProps {
  profile: UserProfile
  onMetricSaved: () => void
}

export default function HealthMetricsPanel({ profile, onMetricSaved }: HealthMetricsPanelProps) {
  const { metrics, summary, loading, error, reload } = useHealthMetrics(profile.id)
  const hasLoadedData = summary !== null || metrics.length > 0
  const initialLoading = loading && !hasLoadedData

  function handleMetricSaved() {
    reload()
    onMetricSaved()
  }

  return (
    <div className="min-w-0 space-y-rhythm-lg">
      {initialLoading ? <LoadingState message="Loading weight data..." /> : null}

      {!initialLoading && loading ? (
        <LoadingState compact message="Refreshing weight data..." />
      ) : null}

      {error ? (
        <Alert
          tone="error"
          title="Unable to load weight data"
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
          <HealthMetricForm
            userProfileId={profile.id}
            metrics={metrics}
            onSaved={handleMetricSaved}
          />
          <HealthMetricHistory metrics={metrics} />
        </>
      ) : null}
    </div>
  )
}
