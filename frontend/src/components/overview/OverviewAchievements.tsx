import type { Achievement } from '../../types/Goal'
import type { OverviewSectionState } from '../../hooks/useOverviewData'
import { Alert } from '../ui/Alert'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { IconContainer } from '../ui/IconContainer'
import { LoadingState } from '../ui/LoadingState'
import { SectionHeader } from '../ui/SectionHeader'
import { StatusBadge } from '../ui/StatusBadge'
import OverviewIcon from './OverviewIcon'

interface OverviewAchievementsProps {
  state: OverviewSectionState<Achievement[]>
}

function isSharedAchievement(achievement: Achievement): boolean {
  return achievement.challengeId !== null
    || achievement.achievementType === 'FIRST_COUPLE_CHALLENGE_COMPLETED'
    || achievement.achievementType === 'BOTH_REACHED_CHALLENGE_TARGET'
}

export default function OverviewAchievements({ state }: OverviewAchievementsProps) {
  const achievements = state.data ?? []

  return (
    <section aria-labelledby="overview-achievements-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-achievements-heading"
        title="Achievements"
        description="Personal and shared milestones earned by the selected profile."
      />
      {state.loading && state.data === null ? <LoadingState message="Loading achievements..." /> : null}
      {state.error && state.data === null ? (
        <Alert tone="error" title="Achievements unavailable">{state.error}</Alert>
      ) : null}
      {state.data !== null && achievements.length === 0 ? (
        <EmptyState
          compact
          icon={<OverviewIcon name="achievement" />}
          iconTone={state.error === null ? 'primary' : 'information'}
          title={state.error === null ? 'No achievements yet' : 'Achievement preview incomplete'}
          description={state.error === null
            ? 'Completed goals and shared challenges can unlock supportive milestones.'
            : 'Previously loaded achievements remain unchanged while unavailable results are retried.'}
        />
      ) : null}
      {achievements.length > 0 ? (
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          {achievements.map((achievement) => {
            const shared = isSharedAchievement(achievement)
            return (
              <Card
                key={`${achievement.achievementType}-${achievement.goalId ?? 'none'}-${achievement.challengeId ?? 'none'}`}
                as="article"
                padding="compact"
                className={shared
                  ? 'min-w-0 border-profile-shared/30 bg-profile-shared-surface/55'
                  : 'min-w-0 border-primary-100 bg-primary-50/55'}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <IconContainer aria-hidden="true" tone={shared ? 'shared' : 'primary'}>
                    <OverviewIcon name={shared ? 'shared' : 'achievement'} />
                  </IconContainer>
                  <div className="min-w-0">
                    <StatusBadge tone={shared ? 'profile-shared' : 'neutral'}>
                      {shared ? 'Shared milestone' : 'Personal milestone'}
                    </StatusBadge>
                    <h3 className="mt-3 break-words text-card-title text-app-primary">
                      {achievement.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 break-words text-supporting text-app-secondary">
                  {achievement.supportiveDescription}
                </p>
              </Card>
            )
          })}
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
