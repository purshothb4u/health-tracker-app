import { useEffect, useState, type FormEvent } from 'react'
import type { WaterGoal, WaterGoalRequest } from '../types/WaterTracking'

interface WaterGoalEditorProps {
  goal: WaterGoal
  mutating: boolean
  onUpdateGoal: (data: WaterGoalRequest) => Promise<WaterGoal>
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function WaterGoalEditor({ goal, mutating, onUpdateGoal }: WaterGoalEditorProps) {
  const [dailyGoalMl, setDailyGoalMl] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDailyGoalMl(goal.dailyGoalMl === null ? '' : String(goal.dailyGoalMl))
    setError(null)
  }, [goal.dailyGoalMl])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedGoal = Number(dailyGoalMl)
    if (!Number.isInteger(parsedGoal) || parsedGoal <= 0) {
      setMessage(null)
      setError('Enter a positive whole-millilitre goal.')
      return
    }

    setMessage(null)
    setError(null)
    try {
      await onUpdateGoal({ dailyGoalMl: parsedGoal })
      setMessage('Daily water goal saved.')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save daily water goal.'))
    }
  }

  const hasGoal = goal.dailyGoalMl !== null

  return (
    <form className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <h4 className="text-base font-semibold text-gray-900">Daily water goal</h4>
        <p className="mt-1 text-sm text-gray-500">
          {hasGoal ? 'Update your configured daily goal.' : 'Set your own daily goal to view hydration progress.'}
        </p>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700">
        Configured goal (ml)
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          disabled={mutating}
          inputMode="numeric"
          min="1"
          step="1"
          type="number"
          value={dailyGoalMl}
          onChange={(event) => {
            setDailyGoalMl(event.target.value)
            setMessage(null)
          }}
        />
      </label>

      {error && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
      {message && <p className="mt-3 text-sm font-medium text-green-700" role="status">{message}</p>}

      <button
        className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={mutating}
        type="submit"
      >
        {mutating ? 'Saving...' : hasGoal ? 'Update daily goal' : 'Save daily goal'}
      </button>
    </form>
  )
}
