import OverviewAchievements from '../components/overview/OverviewAchievements'
import OverviewChallengePreview from '../components/overview/OverviewChallengePreview'
import OverviewGoalPreview from '../components/overview/OverviewGoalPreview'
import OverviewQuickActions from '../components/overview/OverviewQuickActions'
import OverviewStatusCards from '../components/overview/OverviewStatusCards'
import OverviewIcon from '../components/overview/OverviewIcon'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSelectedProfile } from '../context/SelectedProfileContext'
import { useAuth } from '../context/AuthContext'
import { useOverviewData } from '../hooks/useOverviewData'
import { useDailyTargets } from '../hooks/useDailyTargets'

const localDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const refreshedFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function localDateFromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function OverviewPage() {
  const { identity } = useAuth()
  const {
    profiles,
    selectedProfile,
    loading: profilesLoading,
    error: profilesError,
    reloadProfiles,
  } = useSelectedProfile()
  const overview = useOverviewData(selectedProfile?.id ?? null)
  const dailyTargets = useDailyTargets(selectedProfile?.id ?? null)
  const now = new Date()

  function reloadOverview() {
    overview.reload()
    dailyTargets.reload()
  }

  const refreshStatus = overview.lastRefreshedAt !== null
    ? `Last refreshed ${refreshedFormatter.format(new Date(overview.lastRefreshedAt))}.`
    : overview.initialLoading
      ? 'Loading current overview data.'
      : 'Overview data could not be loaded. Review the section errors and reload.'

  return (
    <div className="min-w-0 space-y-rhythm-lg">
      <header className="flex min-w-0 flex-col gap-5 border-b border-app-border-muted pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-label uppercase tracking-[0.14em] text-primary-700">My health</p>
          <h1 className="mt-2 break-words text-page-title text-app-primary">
            {selectedProfile
              ? `${greetingFor(now)}, ${identity?.displayName ?? selectedProfile.displayName}`
              : `${greetingFor(now)}`}
          </h1>
          <p className="mt-2 max-w-2xl break-words text-supporting text-app-secondary">
            A clear view of today, with support beside you.
          </p>
        </div>

        {selectedProfile ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-control border border-app-border bg-app-surface px-3 py-2 text-metadata text-app-secondary shadow-sm">
              <OverviewIcon name="calendar" className="h-4 w-4 text-primary-700" />
              <time dateTime={overview.today}>
                {localDateFormatter.format(localDateFromIsoDate(overview.today))}
              </time>
            </div>
            <Button
              variant="quiet"
              onClick={reloadOverview}
              disabled={overview.initialLoading || overview.refreshing}
              aria-label={overview.initialLoading
                ? 'Loading overview'
                : overview.refreshing ? 'Refreshing overview' : 'Reload overview'}
            >
              <OverviewIcon name="refresh" className="h-4 w-4" />
              {overview.initialLoading
                ? 'Loading...'
                : overview.refreshing ? 'Refreshing...' : 'Reload'}
            </Button>
          </div>
        ) : null}
      </header>

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
        <div className="min-w-0 space-y-rhythm-lg">
          <div
            className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-metadata text-app-secondary"
            role="status"
            aria-live="polite"
          >
            <span>{refreshStatus}</span>
            {overview.refreshing ? (
              <span className="font-semibold text-primary-700">Refreshing in the background...</span>
            ) : null}
          </div>

          <OverviewStatusCards
            profile={selectedProfile}
            today={overview.today}
            health={overview.health}
            nutrition={overview.nutrition}
            hydration={overview.hydration}
            activity={overview.activity}
            dailyTargets={dailyTargets}
            sleep={overview.sleep}
          />
          <OverviewGoalPreview state={overview.goals} />
          <OverviewChallengePreview state={overview.challenge} />
          <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
            <OverviewAchievements state={overview.achievements} />
            <OverviewQuickActions />
          </div>
        </div>
      ) : null}
    </div>
  )
}
