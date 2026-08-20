import AnalyticsPanel from '../components/AnalyticsPanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSelectedProfile } from '../context/SelectedProfileContext'

export default function ProgressPage() {
  const {
    profiles,
    selectedProfile,
    loading,
    error,
    reloadProfiles,
  } = useSelectedProfile()

  return (
    <div className="min-w-0 space-y-rhythm-lg">
      <header className="flex min-w-0 flex-col gap-4 border-b border-app-border-muted pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-label uppercase tracking-[0.14em] text-primary-700">Trends and insights</p>
          <h1 className="mt-2 break-words text-page-title text-app-primary">Progress</h1>
          <p className="mt-2 max-w-3xl break-words text-supporting text-app-secondary sm:text-base">
            {selectedProfile
              ? `Explore selected-range weight and nutrition patterns for ${selectedProfile.displayName}.`
              : 'Explore selected-range weight and nutrition patterns.'}
          </p>
        </div>
      </header>

      {loading && selectedProfile === null ? (
        <LoadingState message="Loading analytics profile..." />
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
        <AnalyticsPanel
          key={selectedProfile.id}
          profileName={selectedProfile.displayName}
          userProfileId={selectedProfile.id}
        />
      ) : null}
    </div>
  )
}
