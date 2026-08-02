import type { GoalProgress } from '../types/Goal'

interface GoalProgressCardProps {
  progress: GoalProgress
}

export default function GoalProgressCard({ progress }: GoalProgressCardProps) {
  if (!progress.progressAvailable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
        {progress.message ?? 'Progress is currently unavailable.'}
      </div>
    )
  }

  const visualPercentage = Math.min(Math.max(progress.progressPercentage ?? 0, 0), 100)

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">
          {progress.currentValue ?? 'Not available'} / {progress.targetValue} {progress.displayUnit}
        </p>
        <p className="text-sm text-gray-600">
          {progress.progressPercentage === null ? 'Not available' : `${progress.progressPercentage.toFixed(2)}%`} · {progress.points} points
        </p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${visualPercentage}%` }}
        />
      </div>
      {progress.goalReached && (
        <p className="text-xs font-medium text-green-700">Target reached.</p>
      )}
      {progress.goalReached === false && (
        <p className="text-xs font-medium text-gray-600">Target not yet reached.</p>
      )}
    </div>
  )
}
