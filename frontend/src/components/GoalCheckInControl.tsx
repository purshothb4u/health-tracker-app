import { useEffect, useState } from 'react'
import type { ProgressCheckInRequest } from '../types/Goal'

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
  const [feedback, setFeedback] = useState<string | null>(null)
  const todayIsInRange = today >= startDate && today <= endDate
  const maximumDate = endDate < today ? endDate : today

  useEffect(() => {
    setDate(today)
    setCompleted(true)
    setNotes('')
    setFeedback(null)
  }, [endDate, startDate, today])

  if (!todayIsInRange) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
        Check-ins are available during this goal or challenge date range.
      </p>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    try {
      await onSubmit(date, { completed, notes: notes || null })
      setFeedback('Check-in saved successfully.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to save check-in.')
    }
  }

  return (
    <form className="space-y-3 rounded-xl border border-primary-100 bg-primary-50/50 p-3" onSubmit={handleSubmit}>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-700">
          Date
          <input
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            disabled={mutating}
            max={maximumDate}
            min={startDate}
            required
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-gray-700">
          Completed
          <select
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            disabled={mutating}
            value={completed ? 'true' : 'false'}
            onChange={(event) => setCompleted(event.target.value === 'true')}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>
      <label className="block text-xs font-medium text-gray-700">
        Notes (optional)
        <input
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          disabled={mutating}
          maxLength={500}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <button
        className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 sm:w-auto"
        disabled={mutating}
        type="submit"
      >
        Save check-in
      </button>
      {feedback && <p className="text-xs text-gray-700" role="status">{feedback}</p>}
    </form>
  )
}
