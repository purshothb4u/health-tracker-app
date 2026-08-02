import { useEffect, useState } from 'react'
import type { Goal, GoalRequest, GoalType } from '../types/Goal'
import { GOAL_TYPE_LABELS } from '../types/Goal'

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

  const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900'

  return (
    <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="font-semibold text-gray-900">{editingGoal ? 'Edit goal' : 'Create goal'}</h4>
        <button className="text-sm font-medium text-gray-600 hover:text-gray-900" type="button" onClick={onCancel}>
          Close
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700 sm:col-span-2">
          Title
          <input className={inputClass} disabled={mutating} maxLength={100} required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Goal type
          <select className={inputClass} disabled={mutating || editingGoal !== null} value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)}>
            {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Target value
          <input className={inputClass} disabled={mutating} min="1" required step="1" type="number" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Start date
          <input className={inputClass} disabled={mutating} required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          End date
          <input className={inputClass} disabled={mutating} min={startDate} required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        {goalType === 'SLEEP_TARGET_DAYS' && (
          <label className="text-sm font-medium text-gray-700">
            Sleep target minutes
            <input className={inputClass} disabled={mutating} max="1440" min="1" required step="1" type="number" value={sleepMinutes} onChange={(event) => setSleepMinutes(event.target.value)} />
          </label>
        )}
        {goalType === 'CUSTOM_CHECK_IN' && (
          <label className="text-sm font-medium text-gray-700">
            Custom unit (optional)
            <input className={inputClass} disabled={mutating} maxLength={30} value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} />
          </label>
        )}
        <label className="text-sm font-medium text-gray-700 sm:col-span-2">
          Notes (optional)
          <textarea className={inputClass} disabled={mutating} maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      {formError && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{formError}</p>}
      <button className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 sm:w-auto" disabled={mutating} type="submit">
        {editingGoal ? 'Save changes' : 'Create goal'}
      </button>
    </form>
  )
}
