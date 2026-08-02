import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import type { Goal, GoalRequest, GoalStatus } from '../types/Goal'
import { GOAL_STATUS_LABELS } from '../types/Goal'
import AchievementBadge from './AchievementBadge'
import GoalCard from './GoalCard'
import GoalForm from './GoalForm'

interface GoalsPanelProps {
  userProfileId: number
  profileName: string
}

const filters: Array<{ value: GoalStatus | null; label: string }> = [
  { value: null, label: 'All' },
  ...Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => ({
    value: value as GoalStatus,
    label,
  })),
]

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export default function GoalsPanel({ userProfileId, profileName }: GoalsPanelProps) {
  const goalsState = useGoals(userProfileId)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function beginCreate() {
    setEditingGoal(null)
    setActionError(null)
    setSuccessMessage(null)
    setShowForm(true)
  }

  function beginEdit(goal: Goal) {
    setEditingGoal(goal)
    setActionError(null)
    setSuccessMessage(null)
    setShowForm(true)
  }

  async function saveGoal(data: GoalRequest): Promise<Goal> {
    setActionError(null)
    setSuccessMessage(null)
    const saved = editingGoal
      ? await goalsState.updateGoal(editingGoal.id, data)
      : await goalsState.createGoal(data)
    setShowForm(false)
    setEditingGoal(null)
    setSuccessMessage(editingGoal ? 'Goal updated.' : 'Goal created.')
    return saved
  }

  async function changeStatus(goalId: number, status: Extract<GoalStatus, 'COMPLETED' | 'CANCELLED'>) {
    setActionError(null)
    setSuccessMessage(null)
    try {
      await goalsState.updateGoalStatus(goalId, { status })
      setSuccessMessage(status === 'COMPLETED' ? 'Goal completed.' : 'Goal cancelled.')
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to update goal status.'))
    }
  }

  async function removeGoal(goalId: number) {
    if (!window.confirm('Delete this goal? This action cannot be undone.')) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      await goalsState.deleteGoal(goalId)
      setSuccessMessage('Goal deleted.')
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to delete goal.'))
    }
  }

  async function saveCheckIn(goalId: number, date: string, completed: boolean, notes: string | null) {
    setActionError(null)
    setSuccessMessage(null)
    try {
      const result = await goalsState.upsertCheckIn(goalId, date, { completed, notes })
      setSuccessMessage('Goal check-in saved.')
      return result
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to save goal check-in.'))
      throw error
    }
  }

  const initialLoading = goalsState.loading && goalsState.goals.length === 0

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
          <p className="mt-1 text-sm text-gray-500">Personal goals for {profileName}</p>
        </div>
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60" disabled={goalsState.mutating} type="button" onClick={beginCreate}>
          Add goal
        </button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Goal status filter">
        {filters.map((filter) => {
          const selected = goalsState.statusFilter === filter.value
          return (
            <button
              key={filter.label}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${selected ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'}`}
              disabled={goalsState.loading}
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingGoal(null)
                goalsState.setStatusFilter(filter.value)
              }}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <GoalForm
          editingGoal={editingGoal}
          mutating={goalsState.mutating}
          onCancel={() => { setShowForm(false); setEditingGoal(null) }}
          onSubmit={saveGoal}
        />
      )}

      {goalsState.refreshing && <p className="text-sm text-gray-500">Refreshing goals...</p>}
      {(actionError || goalsState.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
          <p className="text-sm font-medium text-red-700">{actionError ?? goalsState.error}</p>
          <button className="mt-2 text-sm font-semibold text-red-700 underline" type="button" onClick={goalsState.reload}>Retry</button>
        </div>
      )}
      {successMessage && <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700" role="status">{successMessage}</p>}

      {initialLoading ? (
        <p className="rounded-xl bg-white p-4 text-sm text-gray-500">Loading goals...</p>
      ) : goalsState.goals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">No goals match this filter.</p>
      ) : (
        <div className="space-y-3">
          {goalsState.goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              mutating={goalsState.mutating}
              progress={goalsState.progressByGoalId[goal.id]}
              onCheckIn={saveCheckIn}
              onDelete={removeGoal}
              onEdit={beginEdit}
              onStatus={changeStatus}
            />
          ))}
        </div>
      )}

      {goalsState.achievements.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Achievements</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {goalsState.achievements.map((achievement) => (
              <AchievementBadge key={`${achievement.achievementType}-${achievement.goalId ?? 'none'}-${achievement.challengeId ?? 'none'}`} achievement={achievement} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
