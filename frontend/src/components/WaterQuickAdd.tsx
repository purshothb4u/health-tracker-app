import { useRef, useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface WaterQuickAddProps {
  mutating: boolean
  onAdd: (amountMl: number) => Promise<void>
}

const quickAddAmounts = [250, 500, 1000]

function formatQuickAddAmount(amountMl: number): string {
  return amountMl === 1000 ? '+1 L' : `+${amountMl} ml`
}

function accessibleAmount(amountMl: number): string {
  return amountMl === 1000 ? '1 litre' : `${amountMl} millilitres`
}

export default function WaterQuickAdd({ mutating, onAdd }: WaterQuickAddProps) {
  const [pendingAmountMl, setPendingAmountMl] = useState<number | null>(null)
  const submissionPendingRef = useRef(false)

  async function handleAdd(amountMl: number) {
    if (mutating || submissionPendingRef.current) return

    submissionPendingRef.current = true
    setPendingAmountMl(amountMl)
    try {
      await onAdd(amountMl)
    } finally {
      submissionPendingRef.current = false
      setPendingAmountMl(null)
    }
  }

  return (
    <Card
      as="section"
      padding="normal"
      aria-labelledby="quick-add-water-heading"
      className="min-w-0 border-metric-hydration/25 bg-metric-hydration-surface/35"
    >
      <h3 id="quick-add-water-heading" className="text-card-title text-app-primary">Quick add</h3>
      <div
        className="mt-4 grid grid-cols-3 gap-2 min-[390px]:gap-3"
        role="group"
        aria-label="Quick add water amounts"
        aria-busy={pendingAmountMl !== null}
      >
        {quickAddAmounts.map((amountMl) => (
          <Button
            key={amountMl}
            aria-label={pendingAmountMl === amountMl
              ? `Adding ${accessibleAmount(amountMl)} of water`
              : `Add ${accessibleAmount(amountMl)} of water`}
            className="min-w-0 border-metric-hydration/25 bg-app-surface px-2 hover:border-metric-hydration/45 hover:bg-metric-hydration-surface"
            disabled={mutating || pendingAmountMl !== null}
            variant="secondary"
            onClick={() => { void handleAdd(amountMl) }}
          >
            {pendingAmountMl === amountMl ? 'Adding...' : formatQuickAddAmount(amountMl)}
          </Button>
        ))}
      </div>
    </Card>
  )
}
