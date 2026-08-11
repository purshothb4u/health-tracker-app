import type { Goal, GoalProgress, GoalStatus } from '../types/Goal'
import { GOAL_STATUS_LABELS, GOAL_TYPE_LABELS } from '../types/Goal'
import { formatLocalDate } from '../utils/dateFormatting'
import GoalCheckInControl from './GoalCheckInControl'
import GoalProgressCard from './GoalProgressCard'
import TrackingIcon from './TrackingIcon'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { StatusBadge, type StatusBadgeTone } from './ui/StatusBadge'

interface GoalCardProps {
  goal: Goal
  progress: GoalProgress | undefined
  mutating: boolean
  onEdit: (goal: Goal) => void
  onStatus: (goalId: number, status: Extract<GoalStatus, 'COMPLETED' | 'CANCELLED'>) => Promise<void>
  onDelete: (goalId: number) => Promise<void>
  onCheckIn: (goalId: number, date: string, completed: boolean, notes: string | null) => Promise<unknown>
}

function statusTone(status: GoalStatus): StatusBadgeTone {
  if (status === 'ACTIVE') return 'information'
  if (status === 'COMPLETED') return 'success'
  return 'neutral'
}

export default function GoalCard({ goal, progress, mutating, onEdit, onStatus, onDelete, onCheckIn }: GoalCardProps) {
  const active = goal.status === 'ACTIVE'

  return (
    <Card
      as="article"
      padding="normal"
      elevated={active}
      className={active
        ? 'min-w-0 space-y-5 border-primary-100 bg-primary-50/55'
        : 'min-w-0 space-y-5 border-app-border-muted bg-app-surface'}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <IconContainer aria-hidden="true" tone="primary">
            <TrackingIcon name="target" />
          </IconContainer>
          <div className="min-w-0">
            <p className="text-metadata font-semibold text-primary-700">{GOAL_TYPE_LABELS[goal.goalType]}</p>
            <h3 className="mt-1 break-words text-card-title text-app-primary">{goal.title}</h3>
            <p className="mt-1 break-words text-supporting text-app-secondary">
              {formatLocalDate(goal.startDate)} to {formatLocalDate(goal.endDate)}
            </p>
          </div>
        </div>
        <StatusBadge tone={statusTone(goal.status)}>{GOAL_STATUS_LABELS[goal.status]}</StatusBadge>
      </div>

      {goal.notes ? (
        <p className="rounded-control border border-app-border-muted bg-app-surface/80 px-4 py-3 whitespace-pre-wrap break-words text-supporting text-app-secondary">
          {goal.notes}
        </p>
      ) : null}

      {progress ? (
        <GoalProgressCard progress={progress} />
      ) : (
        <LoadingState compact message={`Loading progress for ${goal.title}...`} />
      )}

      {active && goal.goalType === 'CUSTOM_CHECK_IN' ? (
        <GoalCheckInControl
          endDate={goal.endDate}
          mutating={mutating}
          startDate={goal.startDate}
          onSubmit={(date, data) => onCheckIn(goal.id, date, data.completed, data.notes ?? null)}
        />
      ) : null}

      <div className="flex flex-col gap-2 border-t border-app-border-muted pt-4 sm:flex-row sm:flex-wrap" role="group" aria-label={`Actions for ${goal.title}`}>
        {active ? (
          <Button variant="secondary" disabled={mutating} aria-label={`Edit ${goal.title}`} onClick={() => onEdit(goal)}>
            Edit
          </Button>
        ) : null}
        {active ? (
          <Button disabled={mutating} aria-label={`Complete ${goal.title}`} onClick={() => void onStatus(goal.id, 'COMPLETED')}>
            Complete goal
          </Button>
        ) : null}
        {active ? (
          <Button variant="secondary" disabled={mutating} aria-label={`Cancel ${goal.title}`} onClick={() => void onStatus(goal.id, 'CANCELLED')}>
            Cancel goal
          </Button>
        ) : null}
        <Button variant="destructive" disabled={mutating} aria-label={`Delete ${goal.title}`} onClick={() => void onDelete(goal.id)}>
          Delete goal
        </Button>
      </div>
    </Card>
  )
}
