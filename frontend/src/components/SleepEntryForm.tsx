import { useEffect, useState, type FormEvent } from 'react'
import {
  SLEEP_TYPE_LABELS,
  type SleepEntry,
  type SleepEntryRequest,
  type SleepType,
} from '../types/SleepTracking'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface SleepEntryFormProps {
  editingEntry: SleepEntry | null
  mutating: boolean
  onCreate: (data: SleepEntryRequest) => Promise<SleepEntry>
  onUpdate: (sleepEntryId: number, data: SleepEntryRequest) => Promise<SleepEntry>
  onCancelEdit: () => void
  onActionStart: () => void
}

const sleepTypes = Object.keys(SLEEP_TYPE_LABELS) as SleepType[]
const qualityRatings = [1, 2, 3, 4, 5] as const
const wholeQualityPattern = /^[1-5]$/
const controlClassName = 'min-h-11 w-full min-w-0 max-w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-app-border-muted disabled:opacity-70'

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

function calculateDurationMinutes(startValue: string, endValue: string): number | null {
  const startDateTime = parseLocalDateTime(startValue)
  const endDateTime = parseLocalDateTime(endValue)
  if (startDateTime === null || endDateTime === null || endDateTime <= startDateTime) {
    return null
  }
  return Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 60_000)
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${remainingMinutes} min`
  if (remainingMinutes === 0) return `${hours} hr`
  return `${hours} hr ${remainingMinutes} min`
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function SleepEntryForm({
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
  const durationPreviewMinutes = calculateDurationMinutes(
    formValues.startDateTime,
    formValues.endDateTime,
  )

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
  }, [editingEntry])

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
      sleepDate: formatLocalDate(endDateTime),
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
    <Card
      as="section"
      padding="normal"
      aria-labelledby="sleep-entry-form-heading"
      className={isEditing ? 'border-information-border bg-information-surface/20' : undefined}
    >
      <form aria-describedby={error ? 'sleep-entry-form-error' : undefined} onSubmit={handleSubmit}>
        <div className="flex min-w-0 items-start gap-3">
          <IconContainer aria-hidden="true" tone="sleep">
            <TrackingIcon name={isEditing ? 'sleep' : 'plus'} />
          </IconContainer>
          <SectionHeader
            className="min-w-0 flex-1"
            headingId="sleep-entry-form-heading"
            headingLevel={3}
            title={isEditing ? 'Edit sleep entry' : 'Add sleep entry'}
            description={isEditing ? 'Update this sleep session.' : 'Record a sleep session.'}
            actions={(
              <StatusBadge tone={isEditing ? 'information' : 'sleep'}>
                {isEditing ? 'Editing session' : 'New session'}
              </StatusBadge>
            )}
          />
        </div>

        <div className="mt-5">
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

        <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
          <Field label="Went to bed" required>
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} max={formatLocalDateTimeInput(new Date())} type="datetime-local" value={formValues.startDateTime} onChange={(event) => updateField('startDateTime', event.target.value)} />
            )}
          </Field>
          <Field label="Woke up" required>
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} max={formatLocalDateTimeInput(new Date())} type="datetime-local" value={formValues.endDateTime} onChange={(event) => updateField('endDateTime', event.target.value)} />
            )}
          </Field>
        </div>

        <div className="mt-4 rounded-control border border-metric-sleep/25 bg-metric-sleep-surface/30 px-4 py-3" role="status" aria-live="polite">
          <p className="text-metadata font-medium text-app-secondary">Calculated duration</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-app-primary">
            {durationPreviewMinutes === null ? 'Enter bedtime and wake-up time' : formatDuration(durationPreviewMinutes)}
          </p>
        </div>

        <fieldset className="mt-4 min-w-0">
          <legend className="text-label text-app-primary">
            Quality rating <span className="font-normal text-app-secondary">(optional)</span>
          </legend>
          <p id="sleep-quality-hint" className="sr-only">
            Choose a rating from 1 to 5. Select the current rating again to clear it.
          </p>
          <div className="mt-2 grid max-w-md grid-cols-5 gap-2" aria-describedby="sleep-quality-hint">
            {qualityRatings.map((rating) => {
              const selected = formValues.qualityRating === String(rating)
              return (
                <button
                  key={rating}
                  type="button"
                  aria-label={selected
                    ? `Clear sleep quality rating ${rating} out of 5`
                    : `Rate sleep quality ${rating} out of 5`}
                  aria-pressed={selected}
                  disabled={mutating}
                  onClick={() => updateField('qualityRating', selected ? '' : String(rating))}
                  className={selected
                    ? 'min-h-11 min-w-11 rounded-control border border-metric-sleep bg-metric-sleep text-sm font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55'
                    : 'min-h-11 min-w-11 rounded-control border border-app-border bg-app-surface text-sm font-bold text-app-primary shadow-sm hover:border-metric-sleep hover:bg-metric-sleep-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55'}
                >
                  {rating}
                </button>
              )
            })}
          </div>
        </fieldset>

        <Field className="mt-4" label="Notes" optional hint="Up to 500 characters.">
          {(controlProps) => (
            <textarea {...controlProps} className={`${controlClassName} min-h-24 resize-y`} disabled={mutating} maxLength={500} value={formValues.notes} onChange={(event) => updateField('notes', event.target.value)} />
          )}
        </Field>

        {error ? <Alert id="sleep-entry-form-error" className="mt-4" tone="error" title="Check the sleep entry">{error}</Alert> : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isEditing ? (
            <Button variant="secondary" disabled={mutating} fullWidth className="sm:w-auto" onClick={onCancelEdit}>
              Cancel edit
            </Button>
          ) : null}
          <Button disabled={mutating} fullWidth className="sm:w-auto" type="submit">
            {mutating ? 'Saving sleep entry...' : isEditing ? 'Update sleep entry' : 'Add sleep entry'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
