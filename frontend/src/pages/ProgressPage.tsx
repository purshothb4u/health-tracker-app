import AnalyticsPanel from '../components/AnalyticsPanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusBadge, type StatusBadgeTone } from '../components/ui/StatusBadge'
import { useSelectedProfile } from '../context/SelectedProfileContext'

function profileTone(profileName: string): StatusBadgeTone {
  if (profileName === 'Husband') return 'profile-husband'
  if (profileName === 'Wife') return 'profile-wife'
  return 'information'
}

export default function ProgressPage() {
  const {
    profiles,
    selectedProfile,
    loading,
    error,
    reloadProfiles,
  } = useSelectedProfile()

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        title="Progress"
        description={selectedProfile
          ? `Review selected-range weight and nutrition analytics for ${selectedProfile.name}.`
          : 'Review selected-range weight and nutrition analytics.'}
        actions={selectedProfile ? (
          <StatusBadge tone={profileTone(selectedProfile.name)}>
            Active profile: {selectedProfile.name}
          </StatusBadge>
        ) : undefined}
      />

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
          profileName={selectedProfile.name}
          userProfileId={selectedProfile.id}
        />
      ) : null}
    </div>
  )
}
