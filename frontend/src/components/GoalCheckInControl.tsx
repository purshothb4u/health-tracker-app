import { useEffect, useState } from 'react'
import type { ProgressCheckInRequest } from '../types/Goal'
import TrackingIcon from './TrackingIcon'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'
import { Field } from './ui/Field'
import { IconContainer, type IconContainerTone } from './ui/IconContainer'
import { StatusBadge, type StatusBadgeTone } from './ui/StatusBadge'

type CheckInTone = 'primary' | 'husband' | 'wife' | 'shared'

interface GoalCheckInControlProps {
  startDate: string
  endDate: string
  mutating: boolean
  label?: string
  tone?: CheckInTone
  onSubmit: (date: string, data: ProgressCheckInRequest) => Promise<unknown>
}

function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const containerClasses: Record<CheckInTone, string> = {
  primary: 'border-primary-100 bg-primary-50/50',
  husband: 'border-profile-husband-accent/25 bg-profile-husband-surface/65',
  wife: 'border-profile-wife-accent/25 bg-profile-wife-surface/65',
  shared: 'border-profile-shared/30 bg-profile-shared-surface/60',
}

const iconTones: Record<CheckInTone, IconContainerTone> = {
  primary: 'primary',
  husband: 'husband',
  wife: 'wife',
  shared: 'shared',
}

const identityBadgeTones: Record<CheckInTone, StatusBadgeTone> = {
  primary: 'neutral',
  husband: 'profile-husband',
  wife: 'profile-wife',
  shared: 'profile-shared',
}

export default function GoalCheckInControl({
  startDate,
  endDate,
  mutating,
  label = 'Daily check-in',
  tone = 'primary',
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
        icon={<TrackingIcon name="check" />}
        iconTone={iconTones[tone]}
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

  const inputClass = 'min-h-11 w-full min-w-0 rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-app-border-muted disabled:text-app-secondary'

  return (
    <form
      className={`min-w-0 space-y-4 rounded-card border p-4 ${containerClasses[tone]}`}
      aria-label={label}
      onSubmit={handleSubmit}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconContainer aria-hidden="true" tone={iconTones[tone]} size="small">
            <TrackingIcon name="check" />
          </IconContainer>
          <h4 className="break-words text-card-title text-app-primary">{label}</h4>
        </div>
        <StatusBadge tone={identityBadgeTones[tone]}>{completed ? 'Completed' : 'Not completed'}</StatusBadge>
      </div>
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
