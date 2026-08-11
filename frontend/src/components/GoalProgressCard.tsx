import type { GoalProgress } from '../types/Goal'
import { Alert } from './ui/Alert'
import { ProgressBar } from './ui/ProgressBar'
import { StatusBadge } from './ui/StatusBadge'

interface GoalProgressCardProps {
  progress: GoalProgress
}

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

export default function GoalProgressCard({ progress }: GoalProgressCardProps) {
  const percentageText = progress.progressPercentage === null
    ? 'Not available'
    : `${progress.progressPercentage.toFixed(2)}%`
  const currentText = progress.progressAvailable && progress.currentValue !== null
    ? `${numberFormatter.format(progress.currentValue)} ${progress.displayUnit}`
    : 'Not available'

  return (
    <div className="min-w-0 space-y-4 rounded-card border border-primary-100 bg-app-surface p-4 shadow-sm">
      <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-control bg-primary-50 px-3 py-3">
          <dt className="text-metadata font-medium text-app-secondary">Current</dt>
          <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">
            {currentText}
          </dd>
        </div>
        <div className="min-w-0 rounded-control bg-app-background px-3 py-3">
          <dt className="text-metadata font-medium text-app-secondary">Target</dt>
          <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">
            {numberFormatter.format(progress.targetValue)} {progress.displayUnit}
          </dd>
        </div>
        <div className="min-w-0 rounded-control bg-app-background px-3 py-3">
          <dt className="text-metadata font-medium text-app-secondary">Points</dt>
          <dd className="mt-1 break-words text-base font-bold tabular-nums text-app-primary">
            {numberFormatter.format(progress.points)}
          </dd>
        </div>
      </dl>

      {!progress.progressAvailable ? (
        <Alert tone="information" title="Progress unavailable">
          {progress.message ?? 'Progress is currently unavailable.'}
        </Alert>
      ) : progress.progressPercentage === null ? (
        <p className="text-supporting font-medium text-app-secondary" role="status">
          Goal progress: Not available
        </p>
      ) : (
        <ProgressBar
          value={progress.progressPercentage}
          maximum={100}
          label="Goal progress"
          valueText={percentageText}
          tone="primary"
        />
      )}

      {progress.progressAvailable ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {progress.goalReached === true ? <StatusBadge tone="success">Target reached</StatusBadge> : null}
          {progress.goalReached === false ? <StatusBadge tone="neutral">In progress</StatusBadge> : null}
          {progress.message ? (
            <p className="min-w-0 flex-1 break-words text-supporting text-app-secondary">{progress.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
