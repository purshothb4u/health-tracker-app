import { useEffect, useState, type FormEvent } from 'react'
import type { FoodEntry, FoodEntryRequest, MealType } from '../types/FoodEntry'

interface FoodEntryFormProps {
  selectedDate: string
  editingEntry: FoodEntry | null
  mutating: boolean
  onCreate: (data: FoodEntryRequest) => Promise<FoodEntry>
  onUpdate: (foodEntryId: number, data: FoodEntryRequest) => Promise<FoodEntry>
  onCancelEdit: () => void
}

const mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

function emptyFormValues() {
  return {
    mealType: 'BREAKFAST' as MealType,
    foodName: '',
    quantity: '',
    unit: '',
    calories: '',
    proteinGrams: '',
    carbohydrateGrams: '',
    fatGrams: '',
    notes: '',
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function FoodEntryForm({
  selectedDate,
  editingEntry,
  mutating,
  onCreate,
  onUpdate,
  onCancelEdit,
}: FoodEntryFormProps) {
  const [formValues, setFormValues] = useState(emptyFormValues)
  const [error, setError] = useState<string | null>(null)
  const isEditing = editingEntry !== null

  useEffect(() => {
    if (editingEntry) {
      setFormValues({
        mealType: editingEntry.mealType,
        foodName: editingEntry.foodName,
        quantity: String(editingEntry.quantity),
        unit: editingEntry.unit,
        calories: String(editingEntry.calories),
        proteinGrams: String(editingEntry.proteinGrams),
        carbohydrateGrams: String(editingEntry.carbohydrateGrams),
        fatGrams: String(editingEntry.fatGrams),
        notes: editingEntry.notes ?? '',
      })
    } else {
      setFormValues(emptyFormValues())
    }
    setError(null)
  }, [editingEntry, selectedDate])

  function updateField(field: keyof typeof formValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  function validateNumber(value: string, fieldLabel: string, allowZero: boolean): number | null {
    const parsedValue = Number(value)
    if (!Number.isFinite(parsedValue) || (allowZero ? parsedValue < 0 : parsedValue <= 0)) {
      setError(`${fieldLabel} must be ${allowZero ? 'zero or greater' : 'greater than zero'}`)
      return null
    }
    return parsedValue
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formValues.foodName.trim()) {
      setError('Enter a food name')
      return
    }
    if (!formValues.unit.trim()) {
      setError('Enter a unit')
      return
    }

    const quantity = validateNumber(formValues.quantity, 'Quantity', false)
    const calories = validateNumber(formValues.calories, 'Calories', true)
    const proteinGrams = validateNumber(formValues.proteinGrams, 'Protein', true)
    const carbohydrateGrams = validateNumber(formValues.carbohydrateGrams, 'Carbohydrates', true)
    const fatGrams = validateNumber(formValues.fatGrams, 'Fat', true)
    if (
      quantity === null ||
      calories === null ||
      proteinGrams === null ||
      carbohydrateGrams === null ||
      fatGrams === null
    ) {
      return
    }

    const data: FoodEntryRequest = {
      entryDate: selectedDate,
      mealType: formValues.mealType,
      foodName: formValues.foodName.trim(),
      quantity,
      unit: formValues.unit.trim(),
      calories,
      proteinGrams,
      carbohydrateGrams,
      fatGrams,
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
      setError(getErrorMessage(err, 'Failed to save food entry'))
    }
  }

  return (
    <form className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit food entry' : 'Add food entry'}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? `Update the entry for ${selectedDate}.` : `Record food for ${selectedDate}.`}
          </p>
        </div>
        {isEditing && (
          <button
            className="text-sm font-medium text-gray-600 underline disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutating}
            onClick={onCancelEdit}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Meal
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            value={formValues.mealType}
            onChange={(event) => updateField('mealType', event.target.value)}
          >
            {mealTypes.map((mealType) => (
              <option key={mealType} value={mealType}>
                {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Food name
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            maxLength={150}
            type="text"
            value={formValues.foodName}
            onChange={(event) => updateField('foodName', event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Quantity
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="decimal"
            min="0.01"
            step="0.01"
            type="number"
            value={formValues.quantity}
            onChange={(event) => updateField('quantity', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Unit
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            maxLength={50}
            type="text"
            value={formValues.unit}
            onChange={(event) => updateField('unit', event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm font-medium text-gray-700">
          Calories
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="decimal"
            min="0"
            step="0.01"
            type="number"
            value={formValues.calories}
            onChange={(event) => updateField('calories', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Protein (g)
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="decimal"
            min="0"
            step="0.01"
            type="number"
            value={formValues.proteinGrams}
            onChange={(event) => updateField('proteinGrams', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Carbohydrates (g)
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="decimal"
            min="0"
            step="0.01"
            type="number"
            value={formValues.carbohydrateGrams}
            onChange={(event) => updateField('carbohydrateGrams', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Fat (g)
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            disabled={mutating}
            inputMode="decimal"
            min="0"
            step="0.01"
            type="number"
            value={formValues.fatGrams}
            onChange={(event) => updateField('fatGrams', event.target.value)}
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

      {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}

      <button
        className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={mutating}
        type="submit"
      >
        {mutating ? 'Saving...' : isEditing ? 'Update food entry' : 'Add food entry'}
      </button>
    </form>
  )
}
