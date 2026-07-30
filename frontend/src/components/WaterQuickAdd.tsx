interface WaterQuickAddProps {
  mutating: boolean
  onAdd: (amountMl: number) => Promise<void>
}

const quickAddAmounts = [250, 500, 750, 1000]

export default function WaterQuickAdd({ mutating, onAdd }: WaterQuickAddProps) {
  function handleAdd(amountMl: number) {
    void onAdd(amountMl)
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="text-base font-semibold text-gray-900">Quick add water</h4>
      <p className="mt-1 text-sm text-gray-500">Add water to the selected date.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickAddAmounts.map((amountMl) => (
          <button
            key={amountMl}
            aria-label={`Add ${amountMl} millilitres of water`}
            className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-3 text-sm font-semibold text-primary-800 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutating}
            type="button"
            onClick={() => handleAdd(amountMl)}
          >
            +{amountMl.toLocaleString()} ml
          </button>
        ))}
      </div>
    </section>
  )
}
