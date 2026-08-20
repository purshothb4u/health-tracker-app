import FoodTrackingPanel from '../components/FoodTrackingPanel'
import WaterTrackingPanel from '../components/WaterTrackingPanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSelectedProfile } from '../context/SelectedProfileContext'
import { useDailyTargets } from '../hooks/useDailyTargets'

export default function NutritionPage() {
  const {
    profiles,
    selectedProfile,
    loading,
    error,
    reloadProfiles,
  } = useSelectedProfile()
  const dailyTargets = useDailyTargets(selectedProfile?.id ?? null)

  return (
    <div className="min-w-0 space-y-rhythm-lg">
      <header className="flex min-w-0 flex-col gap-4 border-b border-app-border-muted pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-page-title text-app-primary">Nutrition</h1>
          <p className="mt-2 max-w-3xl break-words text-supporting text-app-secondary sm:text-base">
            Food and hydration tracking for your day.
          </p>
        </div>
      </header>

      {loading && selectedProfile === null ? (
        <LoadingState message="Loading profile nutrition data..." />
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

      {selectedProfile && dailyTargets.loading && dailyTargets.data === null ? (
        <LoadingState compact message="Loading estimated daily targets..." />
      ) : null}

      {selectedProfile && dailyTargets.loading && dailyTargets.data !== null ? (
        <LoadingState compact message="Refreshing estimated daily targets..." />
      ) : null}

      {selectedProfile && dailyTargets.error ? (
        <Alert
          tone="warning"
          title="Estimated daily targets unavailable"
          action={(
            <Button variant="secondary" size="compact" onClick={dailyTargets.reload}>
              Retry targets
            </Button>
          )}
        >
          Food and hydration tracking remain available. {dailyTargets.error}
        </Alert>
      ) : null}

      {!error && selectedProfile ? (
        <div key={selectedProfile.id} className="min-w-0 space-y-12">
          <FoodTrackingPanel
            dailyTargets={dailyTargets.data}
            dailyTargetsLoading={dailyTargets.loading}
            profile={selectedProfile}
          />
          <div className="min-w-0 border-t border-app-border-muted pt-10">
            <WaterTrackingPanel
              dailyTargets={dailyTargets.data}
              dailyTargetsLoading={dailyTargets.loading}
              profileName={selectedProfile.displayName}
              userProfileId={selectedProfile.id}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
