import { useEffect, useState, type FormEvent } from 'react'
import type { WaterEntry, WaterEntryRequest } from '../types/WaterTracking'

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
    <form className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit water entry' : 'Add water entry'}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? `Update the entry for ${selectedDate}.` : `Record water for ${selectedDate}.`}
          </p>
        </div>
        {isEditing && (
          <button
            className="text-sm font-medium text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-60"
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
          Amount (ml)
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="numeric"
            min="1"
            step="1"
            type="number"
            value={formValues.amountMl}
            onChange={(event) => setFormValues((current) => ({ ...current, amountMl: event.target.value }))}
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
          onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))}
        />
      </label>

      {error && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p>}

      <button
        className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={mutating}
        type="submit"
      >
        {mutating ? 'Saving...' : isEditing ? 'Update water entry' : 'Add water entry'}
      </button>
    </form>
  )
}
