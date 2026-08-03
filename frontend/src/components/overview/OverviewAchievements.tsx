import type { Achievement } from '../../types/Goal'
import type { OverviewSectionState } from '../../hooks/useOverviewData'
import AchievementBadge from '../AchievementBadge'
import { Alert } from '../ui/Alert'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { SectionHeader } from '../ui/SectionHeader'

interface OverviewAchievementsProps {
  state: OverviewSectionState<Achievement[]>
}

export default function OverviewAchievements({ state }: OverviewAchievementsProps) {
  const achievements = state.data ?? []

  return (
    <section aria-labelledby="overview-achievements-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-achievements-heading"
        title="Achievements"
        description="Up to three achievements earned by the selected profile."
      />
      {state.loading && state.data === null ? <LoadingState message="Loading achievements..." /> : null}
      {state.error && state.data === null ? (
        <Alert tone="error" title="Achievements unavailable">{state.error}</Alert>
      ) : null}
      {state.data !== null && achievements.length === 0 ? (
        <EmptyState
          compact
          title="No achievements yet"
          description="Completed goals and shared challenges can unlock achievements."
        />
      ) : null}
      {achievements.length > 0 ? (
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={`${achievement.achievementType}-${achievement.goalId ?? 'none'}-${achievement.challengeId ?? 'none'}`}
              achievement={achievement}
            />
          ))}
        </div>
      ) : null}
      {state.data !== null && state.loading ? (
        <LoadingState compact message="Refreshing achievements..." />
      ) : null}
      {state.data !== null && state.error ? (
        <Alert tone="warning" title="Some achievements are unavailable">{state.error}</Alert>
      ) : null}
    </section>
  )
}
