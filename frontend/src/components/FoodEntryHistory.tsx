import type { FoodEntry, MealType } from '../types/FoodEntry'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { SectionHeader } from './ui/SectionHeader'

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
  return (
    <Card as="section" padding="normal" aria-labelledby="food-history-heading">
      <SectionHeader
        headingId="food-history-heading"
        headingLevel={3}
        title="Food history"
        description="Entries are grouped by meal in the order they were recorded."
      />

      {entries.length === 0 ? (
        <EmptyState
          className="mt-5"
          compact
          title="No food logged"
          description="No food entries were recorded for this date. Zero intake is not assumed."
        />
      ) : (
        <div className="mt-5 space-y-5">
          {mealGroups.map(({ mealType, label }) => {
            const mealEntries = entries.filter((entry) => entry.mealType === mealType)
            if (mealEntries.length === 0) {
              return null
            }

            return (
              <div key={mealType}>
                <h4 className="text-sm font-semibold text-app-primary">{label}</h4>
                <div className="mt-2 space-y-3">
                  {mealEntries.map((entry) => (
                    <article key={entry.id} className="min-w-0 rounded-xl border border-app-border bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-app-primary">{entry.foodName}</p>
                          <p className="mt-1 break-words text-sm text-app-secondary">
                            {formatNumber(entry.quantity)} {entry.unit} · {formatNumber(entry.calories)} kcal
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" disabled={mutating} onClick={() => onEdit(entry)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={mutating}
                            onClick={() => { void onDelete(entry.id) }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-1 gap-2 text-xs min-[360px]:grid-cols-3">
                        <div className="rounded-lg bg-app-surface px-2 py-2">
                          <dt className="text-app-secondary">Protein</dt>
                          <dd className="mt-1 font-semibold text-app-primary">{formatNumber(entry.proteinGrams)} g</dd>
                        </div>
                        <div className="rounded-lg bg-app-surface px-2 py-2">
                          <dt className="break-words text-app-secondary">Carbohydrates</dt>
                          <dd className="mt-1 font-semibold text-app-primary">{formatNumber(entry.carbohydrateGrams)} g</dd>
                        </div>
                        <div className="rounded-lg bg-app-surface px-2 py-2">
                          <dt className="text-app-secondary">Fat</dt>
                          <dd className="mt-1 font-semibold text-app-primary">{formatNumber(entry.fatGrams)} g</dd>
                        </div>
                      </dl>
                      {entry.notes ? (
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-app-secondary">{entry.notes}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
