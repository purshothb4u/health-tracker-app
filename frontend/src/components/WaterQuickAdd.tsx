import { useRef, useState } from 'react'
import TrackingIcon from './TrackingIcon'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface WaterQuickAddProps {
  mutating: boolean
  onAdd: (amountMl: number) => Promise<void>
}

const quickAddAmounts = [250, 500, 750, 1000]

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
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="hydration">
          <TrackingIcon name="plus" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId="quick-add-water-heading"
          headingLevel={3}
          title="Quick add water"
          description="Choose a common amount for the selected date."
          actions={<StatusBadge tone="hydration">One tap</StatusBadge>}
        />
      </div>
      <div
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
        role="group"
        aria-label="Quick add water amounts"
        aria-busy={pendingAmountMl !== null}
      >
        {quickAddAmounts.map((amountMl) => (
          <Button
            key={amountMl}
            aria-label={pendingAmountMl === amountMl
              ? `Adding ${amountMl} millilitres of water`
              : `Add ${amountMl} millilitres of water`}
            className="min-w-0 border-metric-hydration/25 bg-app-surface px-2 hover:border-metric-hydration/45 hover:bg-metric-hydration-surface"
            disabled={mutating || pendingAmountMl !== null}
            variant="secondary"
            onClick={() => { void handleAdd(amountMl) }}
          >
            {pendingAmountMl === amountMl ? 'Adding...' : `+${amountMl.toLocaleString()} ml`}
          </Button>
        ))}
      </div>
    </Card>
  )
}
