import { useEffect, useState, type FormEvent } from 'react'
import {
  ACTIVITY_CATEGORY_LABELS,
  type ActivityCategory,
  type ActivityEntry,
  type ActivityEntryRequest,
} from '../types/ActivityTracking'
import { formatLocalDate } from '../utils/dateFormatting'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { SectionHeader } from './ui/SectionHeader'

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
const controlClassName = 'min-h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70'

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
    <Card as="section" padding="normal" aria-labelledby="activity-entry-form-heading">
      <form aria-describedby={error ? 'activity-entry-form-error' : undefined} onSubmit={handleSubmit}>
        <SectionHeader
          headingId="activity-entry-form-heading"
          headingLevel={3}
          title={isEditing ? 'Edit activity entry' : 'Add activity entry'}
          description={`${isEditing ? 'Update' : 'Record'} activity for ${formatLocalDate(selectedDate)}.`}
          actions={isEditing ? (
            <Button variant="secondary" disabled={mutating} onClick={onCancelEdit}>
              Cancel edit
            </Button>
          ) : undefined}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Selected date">
            {(controlProps) => (
              <input {...controlProps} className={`${controlClassName} bg-slate-100`} readOnly type="text" value={formatLocalDate(selectedDate)} />
            )}
          </Field>
          <Field label="Category" required>
            {(controlProps) => (
              <select {...controlProps} className={controlClassName} disabled={mutating} value={formValues.category} onChange={(event) => updateField('category', event.target.value)}>
                {activityCategories.map((category) => (
                  <option key={category} value={category}>{ACTIVITY_CATEGORY_LABELS[category]}</option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <Field className="mt-4" label="Activity name" required hint="Use a clear name up to 100 characters.">
          {(controlProps) => (
            <input {...controlProps} className={controlClassName} disabled={mutating} maxLength={100} type="text" value={formValues.activityName} onChange={(event) => updateField('activityName', event.target.value)} />
          )}
        </Field>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Duration (minutes)" required hint="Enter a whole number from 1 to 1,440.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} inputMode="numeric" placeholder="e.g. 45" type="text" value={formValues.durationMinutes} onChange={(event) => updateField('durationMinutes', event.target.value)} />
            )}
          </Field>
          <Field label="Steps" optional hint="Leave blank if not supplied; zero remains a recorded value.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} inputMode="numeric" placeholder="e.g. 8500" type="text" value={formValues.steps} onChange={(event) => updateField('steps', event.target.value)} />
            )}
          </Field>
          <Field label="Distance (km)" optional hint="Up to three decimal places; zero remains a recorded value.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} inputMode="decimal" placeholder="e.g. 3.275" type="text" value={formValues.distanceKm} onChange={(event) => updateField('distanceKm', event.target.value)} />
            )}
          </Field>
          <Field label="Reported calories burned" optional hint="User-reported kcal; not automatically calculated.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} inputMode="numeric" placeholder="e.g. 250" type="text" value={formValues.reportedCaloriesBurned} onChange={(event) => updateField('reportedCaloriesBurned', event.target.value)} />
            )}
          </Field>
        </div>

        <Field className="mt-4" label="Notes" optional hint="Up to 500 characters.">
          {(controlProps) => (
            <textarea {...controlProps} className={`${controlClassName} min-h-24 resize-y`} disabled={mutating} maxLength={500} value={formValues.notes} onChange={(event) => updateField('notes', event.target.value)} />
          )}
        </Field>

        {error ? <Alert id="activity-entry-form-error" className="mt-4" tone="error" title="Check the activity entry">{error}</Alert> : null}

        <Button className="mt-5" disabled={mutating} fullWidth type="submit">
          {mutating ? 'Saving activity entry...' : isEditing ? 'Update activity entry' : 'Add activity entry'}
        </Button>
      </form>
    </Card>
  )
}
