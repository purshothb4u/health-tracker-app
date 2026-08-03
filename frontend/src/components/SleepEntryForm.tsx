import { useEffect, useState, type FormEvent } from 'react'
import {
  SLEEP_TYPE_LABELS,
  type SleepEntry,
  type SleepEntryRequest,
  type SleepType,
} from '../types/SleepTracking'
import { formatLocalDate as formatDisplayDate } from '../utils/dateFormatting'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { SectionHeader } from './ui/SectionHeader'

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
const controlClassName = 'min-h-11 w-full min-w-0 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70'

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
    <Card as="section" padding="normal" aria-labelledby="sleep-entry-form-heading">
      <form aria-describedby={error ? 'sleep-entry-form-error' : undefined} onSubmit={handleSubmit}>
        <SectionHeader
          headingId="sleep-entry-form-heading"
          headingLevel={3}
          title={isEditing ? 'Edit sleep entry' : 'Add sleep entry'}
          description={`${isEditing ? 'Update' : 'Record'} a session ending on ${formatDisplayDate(selectedDate)}.`}
          actions={isEditing ? (
            <Button variant="secondary" disabled={mutating} onClick={onCancelEdit}>
              Cancel edit
            </Button>
          ) : undefined}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Selected sleep date" hint="This must match the end date below.">
            {(controlProps) => (
              <input {...controlProps} className={`${controlClassName} bg-slate-100`} readOnly type="text" value={formatDisplayDate(selectedDate)} />
            )}
          </Field>
          <Field label="Sleep type" required>
            {(controlProps) => (
              <select {...controlProps} className={controlClassName} disabled={mutating} value={formValues.sleepType} onChange={(event) => updateField('sleepType', event.target.value)}>
                <option value="">Select sleep type</option>
                {sleepTypes.map((sleepType) => (
                  <option key={sleepType} value={sleepType}>{SLEEP_TYPE_LABELS[sleepType]}</option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
          <Field label="Start date and time" required hint="Cross-midnight sessions may start on the previous date.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} max={formatLocalDateTimeInput(new Date())} type="datetime-local" value={formValues.startDateTime} onChange={(event) => updateField('startDateTime', event.target.value)} />
            )}
          </Field>
          <Field label="End date and time" required hint="The end date determines the selected sleep date.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} max={formatLocalDateTimeInput(new Date())} type="datetime-local" value={formValues.endDateTime} onChange={(event) => updateField('endDateTime', event.target.value)} />
            )}
          </Field>
        </div>

        <Field className="mt-4 sm:max-w-[calc(50%-0.5rem)]" label="Quality rating" optional hint="Enter a whole number from 1 to 5, or leave blank.">
          {(controlProps) => (
            <input {...controlProps} className={controlClassName} disabled={mutating} inputMode="numeric" placeholder="1 to 5" type="text" value={formValues.qualityRating} onChange={(event) => updateField('qualityRating', event.target.value)} />
          )}
        </Field>

        <Field className="mt-4" label="Notes" optional hint="Up to 500 characters.">
          {(controlProps) => (
            <textarea {...controlProps} className={`${controlClassName} min-h-24 resize-y`} disabled={mutating} maxLength={500} value={formValues.notes} onChange={(event) => updateField('notes', event.target.value)} />
          )}
        </Field>

        {error ? <Alert id="sleep-entry-form-error" className="mt-4" tone="error" title="Check the sleep entry">{error}</Alert> : null}

        <Button className="mt-5" disabled={mutating} fullWidth type="submit">
          {mutating ? 'Saving sleep entry...' : isEditing ? 'Update sleep entry' : 'Add sleep entry'}
        </Button>
      </form>
    </Card>
  )
}
