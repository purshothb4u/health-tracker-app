import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import type { Goal, GoalRequest, GoalStatus } from '../types/Goal'
import { GOAL_STATUS_LABELS } from '../types/Goal'
import AchievementBadge from './AchievementBadge'
import GoalCard from './GoalCard'
import GoalForm from './GoalForm'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { EmptyState } from './ui/EmptyState'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

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
  const [pendingDeleteGoal, setPendingDeleteGoal] = useState<Pick<Goal, 'id' | 'title'> | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const headingId = `personal-goals-heading-${userProfileId}`

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
    const updating = editingGoal !== null
    const saved = updating
      ? await goalsState.updateGoal(editingGoal.id, data)
      : await goalsState.createGoal(data)
    setShowForm(false)
    setEditingGoal(null)
    setSuccessMessage(updating ? 'Goal updated.' : 'Goal created.')
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
    setActionError(null)
    setSuccessMessage(null)
    const goal = goalsState.goals.find((candidate) => candidate.id === goalId)
    setPendingDeleteGoal({ id: goalId, title: goal?.title ?? 'this goal' })
  }

  async function confirmRemoveGoal() {
    if (pendingDeleteGoal === null) return
    const goalId = pendingDeleteGoal.id
    setActionError(null)
    setSuccessMessage(null)
    try {
      await goalsState.deleteGoal(goalId)
      if (editingGoal?.id === goalId) {
        setEditingGoal(null)
        setShowForm(false)
      }
      setSuccessMessage('Goal deleted.')
    } catch (error) {
      setActionError(messageFrom(error, 'Failed to delete goal.'))
    } finally {
      setPendingDeleteGoal(null)
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
    <Card as="section" padding="normal" className="min-w-0 space-y-5" aria-labelledby={headingId}>
      <SectionHeader
        headingId={headingId}
        headingLevel={2}
        title="Personal goals"
        description={`Goals owned by ${profileName}. Switching profiles changes this section.`}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="information">Owner: {profileName}</StatusBadge>
            <Button disabled={goalsState.mutating} onClick={beginCreate}>Add goal</Button>
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Personal goal status filter">
        {filters.map((filter) => {
          const selected = goalsState.statusFilter === filter.value
          return (
            <Button
              key={filter.label}
              variant={selected ? 'primary' : 'secondary'}
              aria-pressed={selected}
              disabled={goalsState.loading || goalsState.mutating}
              onClick={() => {
                setShowForm(false)
                setEditingGoal(null)
                goalsState.setStatusFilter(filter.value)
              }}
            >
              {filter.label}
            </Button>
          )
        })}
      </div>

      {showForm ? (
        <GoalForm
          editingGoal={editingGoal}
          mutating={goalsState.mutating}
          onCancel={() => { setShowForm(false); setEditingGoal(null) }}
          onSubmit={saveGoal}
        />
      ) : null}

      {goalsState.refreshing ? <LoadingState compact message="Refreshing personal goals..." /> : null}
      {actionError || goalsState.error ? (
        <Alert
          tone="error"
          title="Unable to update personal goals"
          action={<Button variant="secondary" size="compact" disabled={goalsState.mutating} onClick={goalsState.reload}>Retry</Button>}
        >
          {actionError ?? goalsState.error}
        </Alert>
      ) : null}
      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}

      {initialLoading ? (
        <LoadingState message="Loading personal goals..." />
      ) : goalsState.goals.length === 0 ? (
        <EmptyState
          title="No personal goals match this filter"
          description={`Choose another status or add a goal for ${profileName}.`}
        />
      ) : (
        <div className="grid min-w-0 gap-4">
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

      {goalsState.achievements.length > 0 ? (
        <section className="min-w-0 space-y-3" aria-labelledby={`goal-achievements-heading-${userProfileId}`}>
          <SectionHeader
            headingId={`goal-achievements-heading-${userProfileId}`}
            headingLevel={3}
            title="Goal achievements"
            description={`Achievements earned by ${profileName}.`}
          />
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {goalsState.achievements.map((achievement) => (
              <AchievementBadge key={`${achievement.achievementType}-${achievement.goalId ?? 'none'}-${achievement.challengeId ?? 'none'}`} achievement={achievement} />
            ))}
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteGoal !== null}
        title="Delete personal goal?"
        description={pendingDeleteGoal
          ? `“${pendingDeleteGoal.title}” and its check-ins will be permanently removed. This action cannot be undone.`
          : ''}
        confirmLabel="Delete goal"
        confirmingLabel="Deleting goal..."
        confirming={goalsState.mutating}
        onCancel={() => setPendingDeleteGoal(null)}
        onConfirm={() => { void confirmRemoveGoal() }}
      />
    </Card>
  )
}
