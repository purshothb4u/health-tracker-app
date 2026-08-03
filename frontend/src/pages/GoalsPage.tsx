import CoupleChallengesPanel from '../components/CoupleChallengesPanel'
import GoalsPanel from '../components/GoalsPanel'
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

export default function GoalsPage() {
  const {
    profiles,
    selectedProfile,
    participantUserProfileIds,
    loading,
    error,
    reloadProfiles,
  } = useSelectedProfile()

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        title="Goals"
        description={selectedProfile
          ? `Manage ${selectedProfile.name}'s personal goals and the challenges shared by both profiles.`
          : 'Manage personal goals and shared couple challenges.'}
        actions={selectedProfile ? (
          <StatusBadge tone={profileTone(selectedProfile.name)}>
            Personal goals: {selectedProfile.name}
          </StatusBadge>
        ) : undefined}
      />

      {loading && selectedProfile === null ? (
        <LoadingState message="Loading goals and profiles..." />
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
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:items-start">
          <GoalsPanel
            key={selectedProfile.id}
            profileName={selectedProfile.name}
            userProfileId={selectedProfile.id}
          />
          <CoupleChallengesPanel participantUserProfileIds={participantUserProfileIds} />
        </div>
      ) : null}
    </div>
  )
}
