import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { createHealthMetric, updateHealthMetric } from '../api/healthMetricApi'
import type { HealthMetric, HealthMetricRequest } from '../types/HealthMetric'

interface HealthMetricFormProps {
  userProfileId: number
  metrics: HealthMetric[]
  onSaved: () => void
}

function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function HealthMetricForm({
  userProfileId,
  metrics,
  onSaved,
}: HealthMetricFormProps) {
  const todayDate = getTodayDate()
  const todayMetric = metrics.find((metric) => metric.metricDate === todayDate)
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setWeightKg(todayMetric ? String(todayMetric.weightKg) : '')
    setNotes(todayMetric?.notes ?? '')
    setError(null)
  }, [todayMetric])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedWeightKg = Number(weightKg)
    if (!Number.isFinite(parsedWeightKg) || parsedWeightKg <= 0) {
      setError('Enter a positive weight in kilograms')
      return
    }

    const data: HealthMetricRequest = {
      metricDate: todayDate,
      weightKg: parsedWeightKg,
      notes: notes.trim() || undefined,
    }

    setSaving(true)
    setError(null)

    try {
      if (todayMetric) {
        await updateHealthMetric(userProfileId, todayMetric.id, data)
      } else {
        await createHealthMetric(userProfileId, data)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save today\'s weight')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div>
        <h4 className="text-base font-semibold text-gray-900">Today&apos;s weight</h4>
        <p className="mt-1 text-sm text-gray-500">
          {todayMetric ? 'Update today\'s recorded weight.' : 'Record a weight for today.'}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.5fr]">
        <label className="block text-sm font-medium text-gray-700">
          Weight (kg)
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            inputMode="decimal"
            min="0.1"
            step="0.01"
            type="number"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Notes <span className="font-normal text-gray-400">(optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            maxLength={500}
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}

      <button
        className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? 'Saving...' : todayMetric ? 'Update today\'s weight' : 'Save today\'s weight'}
      </button>
    </form>
  )
}
