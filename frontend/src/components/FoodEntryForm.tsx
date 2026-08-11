import { useEffect, useState, type FormEvent } from 'react'
import type { FoodEntry, FoodEntryRequest, MealType } from '../types/FoodEntry'
import { formatLocalDate } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface FoodEntryFormProps {
  selectedDate: string
  editingEntry: FoodEntry | null
  mutating: boolean
  onCreate: (data: FoodEntryRequest) => Promise<FoodEntry>
  onUpdate: (foodEntryId: number, data: FoodEntryRequest) => Promise<FoodEntry>
  onCancelEdit: () => void
}

const mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
const controlClassName = 'min-h-11 w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-app-border-muted disabled:opacity-70'

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
    <Card
      as="section"
      padding="normal"
      aria-labelledby="food-entry-form-heading"
      className={isEditing ? 'border-information-border bg-information-surface/20' : undefined}
    >
      <form aria-describedby={error ? 'food-entry-form-error' : undefined} onSubmit={handleSubmit}>
        <div className="flex min-w-0 items-start gap-3">
          <IconContainer aria-hidden="true" tone="nutrition">
            <TrackingIcon name={isEditing ? 'nutrition' : 'plus'} />
          </IconContainer>
          <SectionHeader
            className="min-w-0 flex-1"
            headingId="food-entry-form-heading"
            headingLevel={3}
            title={isEditing ? 'Edit food entry' : 'Add food entry'}
            description={`${isEditing ? 'Update' : 'Record'} food for ${formatLocalDate(selectedDate)}.`}
            actions={(
              <StatusBadge tone={isEditing ? 'information' : 'nutrition'}>
                {isEditing ? 'Editing entry' : 'New entry'}
              </StatusBadge>
            )}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.3fr)]">
          <Field label="Meal" required>
            {(controlProps) => (
              <select {...controlProps} className={controlClassName} disabled={mutating} value={formValues.mealType} onChange={(event) => updateField('mealType', event.target.value)}>
                {mealTypes.map((mealType) => (
                  <option key={mealType} value={mealType}>{mealType.charAt(0) + mealType.slice(1).toLowerCase()}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Food name" required>
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} maxLength={150} type="text" value={formValues.foodName} onChange={(event) => updateField('foodName', event.target.value)} />
            )}
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Quantity" required hint="Enter an amount greater than zero.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} inputMode="decimal" min="0.01" step="0.01" type="number" value={formValues.quantity} onChange={(event) => updateField('quantity', event.target.value)} />
            )}
          </Field>
          <Field label="Unit" required hint="For example: serving, bowl, g or ml.">
            {(controlProps) => (
              <input {...controlProps} className={controlClassName} disabled={mutating} maxLength={50} type="text" value={formValues.unit} onChange={(event) => updateField('unit', event.target.value)} />
            )}
          </Field>
        </div>

        <fieldset className="mt-5 min-w-0 rounded-control border border-app-border-muted bg-app-background/45 p-4">
          <legend className="px-1 text-label text-app-primary">Nutrition values</legend>
          <p className="mb-4 text-metadata text-app-secondary">Enter zero when a logged food has none of a nutrient.</p>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ['Calories', 'calories'],
              ['Protein (g)', 'proteinGrams'],
              ['Carbohydrates (g)', 'carbohydrateGrams'],
              ['Fat (g)', 'fatGrams'],
            ] as const).map(([label, field]) => (
              <Field key={field} label={label} required hint="Zero or greater.">
                {(controlProps) => (
                  <input {...controlProps} className={controlClassName} disabled={mutating} inputMode="decimal" min="0" step="0.01" type="number" value={formValues[field]} onChange={(event) => updateField(field, event.target.value)} />
                )}
              </Field>
            ))}
          </div>
        </fieldset>

        <Field className="mt-4" label="Notes" optional hint="Up to 500 characters.">
          {(controlProps) => (
            <textarea {...controlProps} className={`${controlClassName} min-h-24 resize-y`} disabled={mutating} maxLength={500} value={formValues.notes} onChange={(event) => updateField('notes', event.target.value)} />
          )}
        </Field>

        {error ? <Alert id="food-entry-form-error" className="mt-4" tone="error" title="Check the food entry">{error}</Alert> : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isEditing ? (
            <Button variant="secondary" disabled={mutating} fullWidth className="sm:w-auto" onClick={onCancelEdit}>
              Cancel edit
            </Button>
          ) : null}
          <Button disabled={mutating} fullWidth className="sm:w-auto" type="submit">
            {mutating ? 'Saving food entry...' : isEditing ? 'Update food entry' : 'Add food entry'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
