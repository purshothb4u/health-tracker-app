import ActivityTrackingPanel from '../components/ActivityTrackingPanel'
import SleepTrackingPanel from '../components/SleepTrackingPanel'
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

export default function ActivityPage() {
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
        title="Activity"
        description={selectedProfile
          ? `Record exercise and sleep for ${selectedProfile.name}.`
          : 'Record exercise and sleep for the selected profile.'}
        actions={selectedProfile ? (
          <StatusBadge tone={profileTone(selectedProfile.name)}>
            Active profile: {selectedProfile.name}
          </StatusBadge>
        ) : undefined}
      />

      {loading && selectedProfile === null ? (
        <LoadingState message="Loading profile activity data..." />
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
        <div key={selectedProfile.id} className="min-w-0 space-y-10">
          <ActivityTrackingPanel
            profileName={selectedProfile.name}
            userProfileId={selectedProfile.id}
          />
          <SleepTrackingPanel
            profileName={selectedProfile.name}
            userProfileId={selectedProfile.id}
          />
        </div>
      ) : null}
    </div>
  )
}
