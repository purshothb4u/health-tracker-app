import { useEffect, useState, type FormEvent } from 'react'
import {
  SLEEP_TYPE_LABELS,
  type SleepEntry,
  type SleepEntryRequest,
  type SleepType,
} from '../types/SleepTracking'

interface SleepEntryFormProps {
  selectedDate: string
  editingEntry: SleepEntry | null
  mutating: boolean
  onCreate: (data: SleepEntryRequest) => Promise<SleepEntry>
  onUpdate: (sleepEntryId: number, data: SleepEntryRequest) => Promise<SleepEntry>
  onCancelEdit: () => void
  onActionStart: () => void
}

const sleepTypes = Object.keys(SLEEP_TYPE_LABELS) as SleepType[]
const wholeQualityPattern = /^[1-5]$/

function emptyFormValues() {
  return {
    sleepType: '' as SleepType | '',
    startDateTime: '',
    endDateTime: '',
    qualityRating: '',
    notes: '',
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLocalDateTimeInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formatLocalDate(date)}T${hours}:${minutes}`
}

function normalizeDateTimeInput(value: string): string {
  return value.length >= 16 ? value.slice(0, 16) : value
}

function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const dateTime = new Date(year, month - 1, day, hour, minute)

  return dateTime.getFullYear() === year
    && dateTime.getMonth() === month - 1
    && dateTime.getDate() === day
    && dateTime.getHours() === hour
    && dateTime.getMinutes() === minute
    ? dateTime
    : null
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function SleepEntryForm({
  selectedDate,
  editingEntry,
  mutating,
  onCreate,
  onUpdate,
  onCancelEdit,
  onActionStart,
}: SleepEntryFormProps) {
  const [formValues, setFormValues] = useState(emptyFormValues)
  const [error, setError] = useState<string | null>(null)
  const isEditing = editingEntry !== null

  useEffect(() => {
    setFormValues(
      editingEntry
        ? {
            sleepType: editingEntry.sleepType,
            startDateTime: normalizeDateTimeInput(editingEntry.startDateTime),
            endDateTime: normalizeDateTimeInput(editingEntry.endDateTime),
            qualityRating:
              editingEntry.qualityRating === null ? '' : String(editingEntry.qualityRating),
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

    if (!formValues.sleepType || !sleepTypes.includes(formValues.sleepType)) {
      setError('Sleep type is required.')
      return
    }
    if (!formValues.startDateTime) {
      setError('Start date and time is required.')
      return
    }
    if (!formValues.endDateTime) {
      setError('End date and time is required.')
      return
    }

    const startDateTime = parseLocalDateTime(formValues.startDateTime)
    const endDateTime = parseLocalDateTime(formValues.endDateTime)
    if (startDateTime === null) {
      setError('Start date and time is invalid.')
      return
    }
    if (endDateTime === null) {
      setError('End date and time is invalid.')
      return
    }
    if (endDateTime <= startDateTime) {
      setError('End date and time must be after start date and time.')
      return
    }
    if (endDateTime > new Date()) {
      setError('End date and time must not be in the future.')
      return
    }
    if (formatLocalDate(endDateTime) !== selectedDate) {
      setError('Sleep date must match the end date.')
      return
    }

    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60_000
    if (durationMinutes < 1) {
      setError('Sleep duration must be at least 1 minute.')
      return
    }
    if (durationMinutes > 1_440) {
      setError('Sleep duration must not exceed 1,440 minutes.')
      return
    }

    const qualityText = formValues.qualityRating.trim()
    if (qualityText !== '' && !wholeQualityPattern.test(qualityText)) {
      setError('Quality rating must be a whole number from 1 to 5.')
      return
    }
    if (formValues.notes.length > 500) {
      setError('Notes must not exceed 500 characters.')
      return
    }

    const data: SleepEntryRequest = {
      sleepDate: selectedDate,
      sleepType: formValues.sleepType,
      startDateTime: formValues.startDateTime,
      endDateTime: formValues.endDateTime,
      qualityRating: qualityText === '' ? null : Number(qualityText),
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
      setError(getErrorMessage(err, 'Failed to save sleep entry.'))
    }
  }

  return (
    <form className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit sleep entry' : 'Add sleep entry'}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? `Update the sleep session for ${selectedDate}.` : `Record sleep for ${selectedDate}.`}
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
          Selected sleep date
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700"
            readOnly
            type="text"
            value={selectedDate}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Sleep type
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            value={formValues.sleepType}
            onChange={(event) => updateField('sleepType', event.target.value)}
          >
            <option value="">Select sleep type</option>
            {sleepTypes.map((sleepType) => (
              <option key={sleepType} value={sleepType}>
                {SLEEP_TYPE_LABELS[sleepType]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block min-w-0 text-sm font-medium text-gray-700">
          Start date and time
          <input
            className="mt-1 block w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            max={formatLocalDateTimeInput(new Date())}
            type="datetime-local"
            value={formValues.startDateTime}
            onChange={(event) => updateField('startDateTime', event.target.value)}
          />
        </label>
        <label className="block min-w-0 text-sm font-medium text-gray-700">
          End date and time
          <input
            className="mt-1 block w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            max={formatLocalDateTimeInput(new Date())}
            type="datetime-local"
            value={formValues.endDateTime}
            onChange={(event) => updateField('endDateTime', event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700 sm:max-w-[calc(50%-0.5rem)]">
        Quality rating <span className="font-normal text-gray-400">(optional, 1 to 5)</span>
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          disabled={mutating}
          inputMode="numeric"
          placeholder="1 to 5"
          type="text"
          value={formValues.qualityRating}
          onChange={(event) => updateField('qualityRating', event.target.value)}
        />
      </label>

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
        {mutating ? 'Saving...' : isEditing ? 'Update sleep entry' : 'Add sleep entry'}
      </button>
    </form>
  )
}
