import type { Achievement } from '../types/Goal'
import TrackingIcon from './TrackingIcon'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { StatusBadge } from './ui/StatusBadge'

interface AchievementBadgeProps {
  achievement: Achievement
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const isSharedMilestone = achievement.challengeId !== null
    || achievement.achievementType === 'FIRST_COUPLE_CHALLENGE_COMPLETED'
    || achievement.achievementType === 'BOTH_REACHED_CHALLENGE_TARGET'

  return (
    <Card
      as="article"
      padding="compact"
      className={isSharedMilestone
        ? 'min-w-0 border-profile-shared/30 bg-profile-shared-surface/60'
        : 'min-w-0 border-primary-100 bg-primary-50/55'}
    >
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone={isSharedMilestone ? 'shared' : 'primary'}>
          <TrackingIcon name="achievement" />
        </IconContainer>
        <div className="min-w-0 flex-1">
          <StatusBadge tone={isSharedMilestone ? 'profile-shared' : 'neutral'}>
            {isSharedMilestone ? 'Shared milestone' : 'Personal milestone'}
          </StatusBadge>
          <h4 className="mt-3 break-words text-card-title text-app-primary">
            {achievement.title}
          </h4>
          <p className="mt-1 break-words text-supporting leading-6 text-app-secondary">
            {achievement.supportiveDescription}
          </p>
        </div>
      </div>
    </Card>
  )
}
