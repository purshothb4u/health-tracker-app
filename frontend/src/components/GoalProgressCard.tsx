import type { GoalProgress } from '../types/Goal'
import { Alert } from './ui/Alert'
import { ProgressBar } from './ui/ProgressBar'

interface GoalProgressCardProps {
  progress: GoalProgress
}

export default function GoalProgressCard({ progress }: GoalProgressCardProps) {
  if (!progress.progressAvailable) {
    return (
      <Alert tone="information" title="Progress unavailable">
        {progress.message ?? 'Progress is currently unavailable.'}
      </Alert>
    )
  }

  const percentageText = progress.progressPercentage === null
    ? 'Not available'
    : `${progress.progressPercentage.toFixed(2)}%`

  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-app-border bg-slate-50 p-4">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="break-words text-sm font-semibold text-app-primary">
          {progress.currentValue ?? 'Not available'} / {progress.targetValue} {progress.displayUnit}
        </p>
        <p className="break-words text-sm text-app-secondary">
          {percentageText} &middot; {progress.points} points
        </p>
      </div>
      {progress.progressPercentage === null ? (
        <p className="text-sm font-medium text-app-secondary" role="status">
          Percentage is not available.
        </p>
      ) : (
        <ProgressBar
          value={progress.progressPercentage}
          maximum={100}
          label="Goal progress"
          valueText={percentageText}
        />
      )}
      {progress.goalReached === true ? (
        <p className="text-sm font-medium text-success">Target reached.</p>
      ) : null}
      {progress.goalReached === false ? (
        <p className="text-sm font-medium text-app-secondary">Target not yet reached.</p>
      ) : null}
      {progress.message ? (
        <p className="break-words text-sm text-app-secondary">{progress.message}</p>
      ) : null}
    </div>
  )
}
