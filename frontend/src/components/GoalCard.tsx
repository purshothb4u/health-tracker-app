import type { Goal, GoalProgress, GoalStatus } from '../types/Goal'
import { GOAL_STATUS_LABELS, GOAL_TYPE_LABELS } from '../types/Goal'
import GoalCheckInControl from './GoalCheckInControl'
import GoalProgressCard from './GoalProgressCard'

interface GoalCardProps {
  goal: Goal
  progress: GoalProgress | undefined
  mutating: boolean
  onEdit: (goal: Goal) => void
  onStatus: (goalId: number, status: Extract<GoalStatus, 'COMPLETED' | 'CANCELLED'>) => Promise<void>
  onDelete: (goalId: number) => Promise<void>
  onCheckIn: (goalId: number, date: string, completed: boolean, notes: string | null) => Promise<unknown>
}

export default function GoalCard({ goal, progress, mutating, onEdit, onStatus, onDelete, onCheckIn }: GoalCardProps) {
  const active = goal.status === 'ACTIVE'
  const buttonClass = 'rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <article className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
          <p className="mt-1 text-xs text-gray-500">{GOAL_TYPE_LABELS[goal.goalType]} · {goal.startDate} to {goal.endDate}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{GOAL_STATUS_LABELS[goal.status]}</span>
      </div>
      {goal.notes && <p className="text-sm text-gray-600">{goal.notes}</p>}
      {progress ? <GoalProgressCard progress={progress} /> : <p className="text-sm text-gray-500">Loading progress...</p>}
      {active && goal.goalType === 'CUSTOM_CHECK_IN' && (
        <GoalCheckInControl
          endDate={goal.endDate}
          mutating={mutating}
          startDate={goal.startDate}
          onSubmit={(date, data) => onCheckIn(goal.id, date, data.completed, data.notes ?? null)}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {active && <button className={`${buttonClass} border-gray-300 text-gray-700`} disabled={mutating} type="button" onClick={() => onEdit(goal)}>Edit</button>}
        {active && <button className={`${buttonClass} border-green-300 text-green-700`} disabled={mutating} type="button" onClick={() => void onStatus(goal.id, 'COMPLETED')}>Complete</button>}
        {active && <button className={`${buttonClass} border-amber-300 text-amber-700`} disabled={mutating} type="button" onClick={() => void onStatus(goal.id, 'CANCELLED')}>Cancel</button>}
        <button className={`${buttonClass} border-red-300 text-red-700`} disabled={mutating} type="button" onClick={() => void onDelete(goal.id)}>Delete</button>
      </div>
    </article>
  )
}
