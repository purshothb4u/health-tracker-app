import type { FoodEntry, MealType } from '../types/FoodEntry'

interface FoodEntryHistoryProps {
  entries: FoodEntry[]
  mutating: boolean
  onEdit: (entry: FoodEntry) => void
  onDelete: (foodEntryId: number) => Promise<void>
}

const mealGroups: Array<{ mealType: MealType; label: string }> = [
  { mealType: 'BREAKFAST', label: 'Breakfast' },
  { mealType: 'LUNCH', label: 'Lunch' },
  { mealType: 'DINNER', label: 'Dinner' },
  { mealType: 'SNACK', label: 'Snacks' },
]

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function FoodEntryHistory({
  entries,
  mutating,
  onEdit,
  onDelete,
}: FoodEntryHistoryProps) {
  async function handleDelete(foodEntryId: number) {
    await onDelete(foodEntryId)
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="text-base font-semibold text-gray-900">Food history</h4>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No food entries for this date.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {mealGroups.map(({ mealType, label }) => {
            const mealEntries = entries.filter((entry) => entry.mealType === mealType)
            if (mealEntries.length === 0) {
              return null
            }

            return (
              <div key={mealType}>
                <h5 className="text-sm font-semibold text-gray-700">{label}</h5>
                <div className="mt-2 space-y-2">
                  {mealEntries.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{entry.foodName}</p>
                          <p className="mt-1 text-sm text-gray-600">
                            {formatNumber(entry.quantity)} {entry.unit} · {formatNumber(entry.calories)} kcal
                          </p>
                        </div>
                        <div className="flex gap-3 text-sm font-medium">
                          <button
                            className="text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={mutating}
                            onClick={() => onEdit(entry)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={mutating}
                            onClick={() => {
                              void handleDelete(entry.id)
                            }}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-white px-2 py-2">
                          <dt className="text-gray-500">Protein</dt>
                          <dd className="mt-1 font-semibold text-gray-900">{formatNumber(entry.proteinGrams)} g</dd>
                        </div>
                        <div className="rounded-lg bg-white px-2 py-2">
                          <dt className="text-gray-500">Carbohydrates</dt>
                          <dd className="mt-1 font-semibold text-gray-900">
                            {formatNumber(entry.carbohydrateGrams)} g
                          </dd>
                        </div>
                        <div className="rounded-lg bg-white px-2 py-2">
                          <dt className="text-gray-500">Fat</dt>
                          <dd className="mt-1 font-semibold text-gray-900">{formatNumber(entry.fatGrams)} g</dd>
                        </div>
                      </dl>
                      {entry.notes && <p className="mt-3 text-sm text-gray-500">{entry.notes}</p>}
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
