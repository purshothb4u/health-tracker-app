import { useEffect, useState, type FormEvent } from 'react'
import {
  ACTIVITY_CATEGORY_LABELS,
  type ActivityCategory,
  type ActivityEntry,
  type ActivityEntryRequest,
} from '../types/ActivityTracking'

interface ActivityEntryFormProps {
  selectedDate: string
  editingEntry: ActivityEntry | null
  mutating: boolean
  onCreate: (data: ActivityEntryRequest) => Promise<ActivityEntry>
  onUpdate: (activityEntryId: number, data: ActivityEntryRequest) => Promise<ActivityEntry>
  onCancelEdit: () => void
  onActionStart: () => void
}

const activityCategories = Object.keys(ACTIVITY_CATEGORY_LABELS) as ActivityCategory[]
const wholeNumberPattern = /^\d+$/
const distancePattern = /^\d+(?:\.\d{1,3})?$/

function emptyFormValues() {
  return {
    category: 'WALKING' as ActivityCategory,
    activityName: '',
    durationMinutes: '',
    steps: '',
    distanceKm: '',
    reportedCaloriesBurned: '',
    notes: '',
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

function parseRequiredWholeNumber(
  value: string,
  fieldLabel: string,
  minimum: number,
  maximum: number,
): number | string {
  if (!wholeNumberPattern.test(value)) {
    return `${fieldLabel} must be a whole number.`
  }
  const parsedValue = Number(value)
  if (!Number.isSafeInteger(parsedValue) || parsedValue < minimum || parsedValue > maximum) {
    return `${fieldLabel} must be between ${minimum.toLocaleString()} and ${maximum.toLocaleString()}.`
  }
  return parsedValue
}

function parseOptionalWholeNumber(
  value: string,
  fieldLabel: string,
  maximum: number,
): number | null | string {
  const trimmedValue = value.trim()
  if (trimmedValue === '') {
    return null
  }
  return parseRequiredWholeNumber(trimmedValue, fieldLabel, 0, maximum)
}

function parseOptionalDistance(value: string): number | null | string {
  const trimmedValue = value.trim()
  if (trimmedValue === '') {
    return null
  }
  if (!distancePattern.test(trimmedValue)) {
    return 'Distance must be a complete number with no more than three decimal places.'
  }
  const parsedValue = Number(trimmedValue)
  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 10_000) {
    return 'Distance must be between 0 and 10,000 km.'
  }
  return parsedValue
}

export default function ActivityEntryForm({
  selectedDate,
  editingEntry,
  mutating,
  onCreate,
  onUpdate,
  onCancelEdit,
  onActionStart,
}: ActivityEntryFormProps) {
  const [formValues, setFormValues] = useState(emptyFormValues)
  const [error, setError] = useState<string | null>(null)
  const isEditing = editingEntry !== null

  useEffect(() => {
    setFormValues(
      editingEntry
        ? {
            category: editingEntry.category,
            activityName: editingEntry.activityName,
            durationMinutes: String(editingEntry.durationMinutes),
            steps: editingEntry.steps === null ? '' : String(editingEntry.steps),
            distanceKm: editingEntry.distanceKm === null ? '' : String(editingEntry.distanceKm),
            reportedCaloriesBurned:
              editingEntry.reportedCaloriesBurned === null
                ? ''
                : String(editingEntry.reportedCaloriesBurned),
            notes: editingEntry.notes ?? '',
          }
        : emptyFormValues(),
    )
    setError(null)
  }, [editingEntry, selectedDate])

  function updateField(field: keyof typeof formValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onActionStart()

    const activityName = formValues.activityName.trim()
    if (activityName === '') {
      setError('Activity name is required.')
      return
    }
    if (formValues.activityName.length > 100) {
      setError('Activity name must not exceed 100 characters.')
      return
    }

    const durationMinutes = parseRequiredWholeNumber(
      formValues.durationMinutes.trim(),
      'Duration',
      1,
      1_440,
    )
    if (typeof durationMinutes === 'string') {
      setError(durationMinutes)
      return
    }

    const steps = parseOptionalWholeNumber(formValues.steps, 'Steps', 1_000_000)
    if (typeof steps === 'string') {
      setError(steps)
      return
    }

    const distanceKm = parseOptionalDistance(formValues.distanceKm)
    if (typeof distanceKm === 'string') {
      setError(distanceKm)
      return
    }

    const reportedCaloriesBurned = parseOptionalWholeNumber(
      formValues.reportedCaloriesBurned,
      'Reported calories burned',
      100_000,
    )
    if (typeof reportedCaloriesBurned === 'string') {
      setError(reportedCaloriesBurned)
      return
    }

    if (formValues.notes.length > 500) {
      setError('Notes must not exceed 500 characters.')
      return
    }

    const data: ActivityEntryRequest = {
      activityDate: selectedDate,
      category: formValues.category,
      activityName,
      durationMinutes,
      steps,
      distanceKm,
      reportedCaloriesBurned,
      notes: formValues.notes.trim() || null,
    }

    setError(null)
    try {
      if (editingEntry) {
        await onUpdate(editingEntry.id, data)
      } else {
        await onCreate(data)
      }
      onCancelEdit()
      setFormValues(emptyFormValues())
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save activity entry.'))
    }
  }

  return (
    <form className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit activity entry' : 'Add activity entry'}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? `Update the activity for ${selectedDate}.` : `Record activity for ${selectedDate}.`}
          </p>
        </div>
        {isEditing && (
          <button
            className="shrink-0 text-sm font-medium text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutating}
            type="button"
            onClick={onCancelEdit}
          >
            Cancel edit
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Selected date
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700"
            readOnly
            type="text"
            value={selectedDate}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Category
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            value={formValues.category}
            onChange={(event) => updateField('category', event.target.value)}
          >
            {activityCategories.map((category) => (
              <option key={category} value={category}>
                {ACTIVITY_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700">
        Activity name
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          disabled={mutating}
          maxLength={100}
          type="text"
          value={formValues.activityName}
          onChange={(event) => updateField('activityName', event.target.value)}
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Duration (minutes)
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="numeric"
            placeholder="e.g. 45"
            type="text"
            value={formValues.durationMinutes}
            onChange={(event) => updateField('durationMinutes', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Steps <span className="font-normal text-gray-400">(optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="numeric"
            placeholder="e.g. 8500"
            type="text"
            value={formValues.steps}
            onChange={(event) => updateField('steps', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Distance (km) <span className="font-normal text-gray-400">(optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="decimal"
            placeholder="e.g. 3.275"
            type="text"
            value={formValues.distanceKm}
            onChange={(event) => updateField('distanceKm', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Reported calories burned <span className="font-normal text-gray-400">(optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="numeric"
            placeholder="User-reported kcal"
            type="text"
            value={formValues.reportedCaloriesBurned}
            onChange={(event) => updateField('reportedCaloriesBurned', event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700">
        Notes <span className="font-normal text-gray-400">(optional)</span>
        <textarea
          className="mt-1 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          disabled={mutating}
          maxLength={500}
          value={formValues.notes}
          onChange={(event) => updateField('notes', event.target.value)}
        />
      </label>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={mutating}
        type="submit"
      >
        {mutating ? 'Saving...' : isEditing ? 'Update activity entry' : 'Add activity entry'}
      </button>
    </form>
  )
}
