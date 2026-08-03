import { useEffect, useState, type FormEvent } from 'react'
import type { WaterEntry, WaterEntryRequest } from '../types/WaterTracking'
import { formatLocalDate } from '../utils/dateFormatting'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { SectionHeader } from './ui/SectionHeader'

const controlClassName = 'min-h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70'

interface WaterEntryFormProps {
  selectedDate: string
  editingEntry: WaterEntry | null
  mutating: boolean
  onCreate: (data: WaterEntryRequest) => Promise<WaterEntry>
  onUpdate: (waterEntryId: number, data: WaterEntryRequest) => Promise<WaterEntry>
  onCancelEdit: () => void
}

function emptyFormValues() {
  return { amountMl: '', notes: '' }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function WaterEntryForm({
  selectedDate,
  editingEntry,
  mutating,
  onCreate,
  onUpdate,
  onCancelEdit,
}: WaterEntryFormProps) {
  const [formValues, setFormValues] = useState(emptyFormValues)
  const [error, setError] = useState<string | null>(null)
  const isEditing = editingEntry !== null

  useEffect(() => {
    setFormValues(
      editingEntry
        ? { amountMl: String(editingEntry.amountMl), notes: editingEntry.notes ?? '' }
        : emptyFormValues(),
    )
    setError(null)
  }, [editingEntry, selectedDate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amountMl = Number(formValues.amountMl)
    if (!Number.isInteger(amountMl) || amountMl <= 0) {
      setError('Amount must be a positive whole number of millilitres.')
      return
    }
    if (formValues.notes.length > 500) {
      setError('Notes must not exceed 500 characters.')
      return
    }

    const data: WaterEntryRequest = {
      entryDate: selectedDate,
      amountMl,
      notes: formValues.notes.trim() || undefined,
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
      setError(getErrorMessage(err, 'Failed to save water entry.'))
    }
  }

  return (
    <Card as="section" padding="normal" aria-labelledby="water-entry-form-heading">
      <form aria-describedby={error ? 'water-entry-form-error' : undefined} onSubmit={handleSubmit}>
        <SectionHeader
          headingId="water-entry-form-heading"
          headingLevel={3}
          title={isEditing ? 'Edit water entry' : 'Add custom water entry'}
          description={`${isEditing ? 'Update' : 'Record'} water for ${formatLocalDate(selectedDate)}.`}
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
          <Field label="Amount (ml)" required hint="Enter a positive whole number of millilitres.">
            {(controlProps) => (
              <input
                {...controlProps}
                className={controlClassName}
                disabled={mutating}
                inputMode="numeric"
                min="1"
                step="1"
                type="number"
                value={formValues.amountMl}
                onChange={(event) => setFormValues((current) => ({ ...current, amountMl: event.target.value }))}
              />
            )}
          </Field>
        </div>

        <Field className="mt-4" label="Notes" optional hint="Up to 500 characters.">
          {(controlProps) => (
            <textarea
              {...controlProps}
              className={`${controlClassName} min-h-24 resize-y`}
              disabled={mutating}
              maxLength={500}
              value={formValues.notes}
              onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))}
            />
          )}
        </Field>

        {error ? <Alert id="water-entry-form-error" className="mt-4" tone="error" title="Check the water entry">{error}</Alert> : null}

        <Button className="mt-5" disabled={mutating} fullWidth type="submit">
          {mutating ? 'Saving water entry...' : isEditing ? 'Update water entry' : 'Add water entry'}
        </Button>
      </form>
    </Card>
  )
}
