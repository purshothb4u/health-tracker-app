import OverviewAchievements from '../components/overview/OverviewAchievements'
import OverviewChallengePreview from '../components/overview/OverviewChallengePreview'
import OverviewGoalPreview from '../components/overview/OverviewGoalPreview'
import OverviewQuickActions from '../components/overview/OverviewQuickActions'
import OverviewStatusCards from '../components/overview/OverviewStatusCards'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusBadge, type StatusBadgeTone } from '../components/ui/StatusBadge'
import { useSelectedProfile } from '../context/SelectedProfileContext'
import { useOverviewData } from '../hooks/useOverviewData'

const refreshedFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function profileTone(profileName: string): StatusBadgeTone {
  if (profileName === 'Husband') return 'profile-husband'
  if (profileName === 'Wife') return 'profile-wife'
  return 'information'
}

export default function OverviewPage() {
  const {
    profiles,
    selectedProfile,
    loading: profilesLoading,
    error: profilesError,
    reloadProfiles,
  } = useSelectedProfile()
  const overview = useOverviewData(selectedProfile?.id ?? null)

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        title="Overview"
        description={selectedProfile
          ? `A quick look at ${selectedProfile.name}'s latest health and wellbeing progress.`
          : 'A quick look at your latest health and wellbeing progress.'}
        actions={selectedProfile ? (
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={profileTone(selectedProfile.name)}>
              Active profile: {selectedProfile.name}
            </StatusBadge>
            <Button
              variant="secondary"
              onClick={overview.reload}
              disabled={overview.initialLoading || overview.refreshing}
            >
              {overview.initialLoading
                ? 'Loading...'
                : overview.refreshing ? 'Refreshing...' : 'Reload overview'}
            </Button>
          </div>
        ) : undefined}
      />

      {profilesLoading && selectedProfile === null ? (
        <LoadingState message="Loading overview profile..." />
      ) : null}

      {!profilesLoading && profilesError ? (
        <Alert
          tone="error"
          title="Unable to load the selected profile"
          action={(
            <Button variant="secondary" size="compact" onClick={reloadProfiles}>
              Retry
            </Button>
          )}
        >
          {profilesError}
        </Alert>
      ) : null}

      {!profilesLoading && !profilesError && profiles.length === 0 ? (
        <EmptyState
          title="No user profiles yet"
          description="Create profiles through the existing user API or restart with development seed data enabled."
        />
      ) : null}

      {!profilesError && selectedProfile ? (
        <div className="min-w-0 space-y-8">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-app-secondary" role="status" aria-live="polite">
            <span>
              {overview.lastRefreshedAt === null
                ? 'Loading current overview data.'
                : `Last refreshed ${refreshedFormatter.format(new Date(overview.lastRefreshedAt))}.`}
            </span>
            {overview.refreshing ? <span className="font-medium text-primary-700">Refreshing in the background...</span> : null}
          </div>

          <OverviewStatusCards
            profile={selectedProfile}
            today={overview.today}
            health={overview.health}
            nutrition={overview.nutrition}
            hydration={overview.hydration}
            activity={overview.activity}
            sleep={overview.sleep}
          />
          <OverviewGoalPreview state={overview.goals} />
          <OverviewChallengePreview state={overview.challenge} />
          <OverviewAchievements state={overview.achievements} />
          <OverviewQuickActions />
        </div>
      ) : null}
    </div>
  )
}
