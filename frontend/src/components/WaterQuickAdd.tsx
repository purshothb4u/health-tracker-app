import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

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
    <Card as="section" padding="normal" aria-labelledby="quick-add-water-heading">
      <SectionHeader
        headingId="quick-add-water-heading"
        headingLevel={3}
        title="Quick add water"
        description="Choose a common amount for the selected date."
      />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickAddAmounts.map((amountMl) => (
          <Button
            key={amountMl}
            aria-label={`Add ${amountMl} millilitres of water`}
            className="min-w-0 px-2"
            disabled={mutating}
            variant="secondary"
            onClick={() => handleAdd(amountMl)}
          >
            +{amountMl.toLocaleString()} ml
          </Button>
        ))}
      </div>
    </Card>
  )
}
