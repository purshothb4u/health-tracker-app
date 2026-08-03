import { useEffect, useState } from 'react'
import type { ProgressCheckInRequest } from '../types/Goal'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'
import { Field } from './ui/Field'

interface GoalCheckInControlProps {
  startDate: string
  endDate: string
  mutating: boolean
  label?: string
  onSubmit: (date: string, data: ProgressCheckInRequest) => Promise<unknown>
}

function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function GoalCheckInControl({
  startDate,
  endDate,
  mutating,
  label = 'Daily check-in',
  onSubmit,
}: GoalCheckInControlProps) {
  const today = getTodayLocalDate()
  const [date, setDate] = useState(today)
  const [completed, setCompleted] = useState(true)
  const [notes, setNotes] = useState('')
  const todayIsInRange = today >= startDate && today <= endDate
  const maximumDate = endDate < today ? endDate : today

  useEffect(() => {
    setDate(today)
    setCompleted(true)
    setNotes('')
  }, [endDate, startDate, today])

  if (!todayIsInRange) {
    return (
      <EmptyState
        compact
        title="Check-in unavailable"
        description="Check-ins are available only during this goal or challenge date range."
      />
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await onSubmit(date, { completed, notes: notes || null })
    } catch {
      // The owning panel provides the single accessible mutation error message.
    }
  }

  const inputClass = 'min-h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-primary shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-focus'

  return (
    <form
      className="min-w-0 space-y-4 rounded-xl border border-primary-100 bg-primary-50/50 p-4"
      aria-label={label}
      onSubmit={handleSubmit}
    >
      <p className="break-words text-sm font-semibold text-app-primary">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date" required>
          {(controlProps) => (
            <input
              {...controlProps}
              className={inputClass}
              disabled={mutating}
              max={maximumDate}
              min={startDate}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>
        <Field label="Completed" required>
          {(controlProps) => (
            <select
              {...controlProps}
              className={inputClass}
              disabled={mutating}
              value={completed ? 'true' : 'false'}
              onChange={(event) => setCompleted(event.target.value === 'true')}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          )}
        </Field>
      </div>
      <Field label="Notes" optional hint="Up to 500 characters.">
        {(controlProps) => (
          <input
            {...controlProps}
            className={inputClass}
            disabled={mutating}
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        )}
      </Field>
      <Button className="w-full sm:w-auto" disabled={mutating} type="submit">
        {mutating ? 'Saving check-in...' : 'Save check-in'}
      </Button>
    </form>
  )
}
