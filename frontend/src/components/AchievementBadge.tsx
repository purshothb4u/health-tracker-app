import type { Achievement } from '../types/Goal'
import { Card } from './ui/Card'
import { StatusBadge } from './ui/StatusBadge'

interface AchievementBadgeProps {
  achievement: Achievement
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <Card as="article" padding="compact" className="min-w-0 border-warning-border bg-warning-surface">
      <StatusBadge tone="warning">Achievement</StatusBadge>
      <h4 className="mt-3 break-words text-sm font-semibold text-app-primary">
        {achievement.title}
      </h4>
      <p className="mt-1 break-words text-sm leading-6 text-app-secondary">
        {achievement.supportiveDescription}
      </p>
    </Card>
  )
}
