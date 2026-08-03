import { useEffect, useState } from 'react'
import type { Goal, GoalRequest, GoalType } from '../types/Goal'
import { GOAL_TYPE_LABELS } from '../types/Goal'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { SectionHeader } from './ui/SectionHeader'

interface GoalFormProps {
  editingGoal: Goal | null
  mutating: boolean
  onCancel: () => void
  onSubmit: (data: GoalRequest) => Promise<Goal>
}

function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function GoalForm({ editingGoal, mutating, onCancel, onSubmit }: GoalFormProps) {
  const [title, setTitle] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('ACTIVITY_MINUTES')
  const [startDate, setStartDate] = useState(getTodayLocalDate)
  const [endDate, setEndDate] = useState(getTodayLocalDate)
  const [targetValue, setTargetValue] = useState('1')
  const [sleepMinutes, setSleepMinutes] = useState('420')
  const [customUnit, setCustomUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title)
      setGoalType(editingGoal.goalType)
      setStartDate(editingGoal.startDate)
      setEndDate(editingGoal.endDate)
      setTargetValue(String(editingGoal.targetValue))
      setSleepMinutes(String(editingGoal.qualifyingSleepMinutes ?? 420))
      setCustomUnit(editingGoal.customUnit ?? '')
      setNotes(editingGoal.notes ?? '')
    } else {
      const today = getTodayLocalDate()
      setTitle('')
      setGoalType('ACTIVITY_MINUTES')
      setStartDate(today)
      setEndDate(today)
      setTargetValue('1')
      setSleepMinutes('420')
      setCustomUnit('')
      setNotes('')
    }
    setFormError(null)
  }, [editingGoal])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const numericTarget = Number(targetValue)
    const numericSleepMinutes = Number(sleepMinutes)
    if (!Number.isInteger(numericTarget) || numericTarget <= 0) {
      setFormError('Target value must be a positive whole number.')
      return
    }
    if (goalType === 'SLEEP_TARGET_DAYS'
      && (!Number.isInteger(numericSleepMinutes) || numericSleepMinutes < 1)) {
      setFormError('Sleep target minutes must be a positive whole number.')
      return
    }

    try {
      await onSubmit({
        title,
        goalType,
        startDate,
        endDate,
        targetValue: numericTarget,
        qualifyingSleepMinutes: goalType === 'SLEEP_TARGET_DAYS' ? numericSleepMinutes : null,
        customUnit: goalType === 'CUSTOM_CHECK_IN' ? customUnit || null : null,
        notes: notes || null,
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save goal.')
    }
  }

  const inputClass = 'min-h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-primary shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-app-secondary'

  return (
    <Card padding="normal" className="min-w-0 border-primary-200 bg-primary-50/30">
      <SectionHeader
        headingId="personal-goal-form-heading"
        headingLevel={3}
        title={editingGoal ? 'Edit personal goal' : 'Create personal goal'}
        description={editingGoal
          ? 'Goal type remains fixed while editing.'
          : 'Set a measurable target for the selected profile.'}
        actions={(
          <Button variant="secondary" disabled={mutating} onClick={onCancel}>
            {editingGoal ? 'Cancel edit' : 'Cancel'}
          </Button>
        )}
      />
      <form
        className="mt-5 space-y-5"
        aria-describedby={formError ? 'personal-goal-form-error' : undefined}
        aria-labelledby="personal-goal-form-heading"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Title" required hint="Use a clear title up to 100 characters.">
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} />
            )}
          </Field>
          <Field label="Goal type" required hint={editingGoal ? 'Goal type cannot be changed after creation.' : undefined}>
            {(controlProps) => (
              <select {...controlProps} className={inputClass} disabled={mutating || editingGoal !== null} value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)}>
                {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            )}
          </Field>
          <Field label="Target value" required hint="Enter a positive whole number.">
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} min="1" step="1" type="number" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
            )}
          </Field>
          <Field label="Start date" required>
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            )}
          </Field>
          <Field label="End date" required hint="The end date must be on or after the start date.">
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} min={startDate} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            )}
          </Field>
          {goalType === 'SLEEP_TARGET_DAYS' ? (
            <Field label="Qualifying sleep minutes" required hint="Enter a whole number from 1 to 1,440.">
              {(controlProps) => (
                <input {...controlProps} className={inputClass} disabled={mutating} max="1440" min="1" step="1" type="number" value={sleepMinutes} onChange={(event) => setSleepMinutes(event.target.value)} />
              )}
            </Field>
          ) : null}
          {goalType === 'CUSTOM_CHECK_IN' ? (
            <Field label="Custom unit" optional hint="Up to 30 characters.">
              {(controlProps) => (
                <input {...controlProps} className={inputClass} disabled={mutating} maxLength={30} value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} />
              )}
            </Field>
          ) : null}
          <Field className="sm:col-span-2" label="Notes" optional hint="Up to 500 characters.">
            {(controlProps) => (
              <textarea {...controlProps} className={inputClass} disabled={mutating} maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            )}
          </Field>
        </div>
        {formError ? <Alert id="personal-goal-form-error" tone="error" title="Unable to save goal">{formError}</Alert> : null}
        <Button className="w-full sm:w-auto" disabled={mutating} type="submit">
          {mutating ? 'Saving goal...' : editingGoal ? 'Save goal changes' : 'Create goal'}
        </Button>
      </form>
    </Card>
  )
}
