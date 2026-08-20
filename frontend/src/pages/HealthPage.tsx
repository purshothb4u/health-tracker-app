import HealthMetricsPanel from '../components/HealthMetricsPanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSelectedProfile } from '../context/SelectedProfileContext'
import { useDailyTargetsInvalidation } from '../context/DailyTargetsContext'

export default function HealthPage() {
  const refreshDailyTargets = useDailyTargetsInvalidation()
  const {
    profiles,
    selectedProfile,
    loading,
    error,
    reloadProfiles,
  } = useSelectedProfile()

  function handleMetricSaved() {
    reloadProfiles()
    refreshDailyTargets()
  }

  return (
    <div className="min-w-0 space-y-rhythm-lg">
      <header className="flex min-w-0 flex-col gap-4 border-b border-app-border-muted pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-page-title text-app-primary">Health</h1>
          <p className="mt-2 max-w-3xl break-words text-supporting text-app-secondary sm:text-base">
            Track and review your weight.
          </p>
        </div>
      </header>

      {loading && selectedProfile === null ? (
        <LoadingState message="Loading profile health data..." />
      ) : null}

      {!loading && error ? (
        <Alert
          tone="error"
          title="Unable to load the selected profile"
          action={(
            <Button variant="secondary" size="compact" onClick={reloadProfiles}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      ) : null}

      {!loading && !error && profiles.length === 0 ? (
        <EmptyState
          title="No user profiles yet"
          description="Create profiles through the existing user API or restart with development seed data enabled."
        />
      ) : null}

      {!error && selectedProfile ? (
        <div key={selectedProfile.id} className="min-w-0">
          <HealthMetricsPanel profile={selectedProfile} onMetricSaved={handleMetricSaved} />
        </div>
      ) : null}
    </div>
  )
}
