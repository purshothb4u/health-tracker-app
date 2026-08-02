import type { Achievement } from '../types/Goal'

interface AchievementBadgeProps {
  achievement: Achievement
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <article className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">{achievement.title}</p>
      <p className="mt-1 text-xs leading-5 text-amber-800">
        {achievement.supportiveDescription}
      </p>
    </article>
  )
}
