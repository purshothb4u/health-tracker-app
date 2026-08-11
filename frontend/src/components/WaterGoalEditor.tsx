import { useEffect, useState, type FormEvent } from 'react'
import type { WaterGoal, WaterGoalRequest } from '../types/WaterTracking'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface WaterGoalEditorProps {
  goal: WaterGoal
  mutating: boolean
  onUpdateGoal: (data: WaterGoalRequest) => Promise<WaterGoal>
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function WaterGoalEditor({ goal, mutating, onUpdateGoal }: WaterGoalEditorProps) {
  const [dailyGoalMl, setDailyGoalMl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDailyGoalMl(goal.dailyGoalMl === null ? '' : String(goal.dailyGoalMl))
    setError(null)
  }, [goal.dailyGoalMl])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedGoal = Number(dailyGoalMl)
    if (!Number.isInteger(parsedGoal) || parsedGoal <= 0) {
      setError('Enter a positive whole-millilitre goal.')
      return
    }

    setError(null)
    try {
      await onUpdateGoal({ dailyGoalMl: parsedGoal })
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save daily water goal.'))
    }
  }

  const hasGoal = goal.dailyGoalMl !== null

  return (
    <Card
      as="section"
      padding="normal"
      aria-labelledby="water-goal-heading"
      className="min-w-0 border-metric-hydration/20"
    >
      <form aria-describedby={error ? 'water-goal-error' : undefined} onSubmit={handleSubmit}>
        <div className="flex min-w-0 items-start gap-3">
          <IconContainer aria-hidden="true" tone="hydration">
            <TrackingIcon name="target" />
          </IconContainer>
          <SectionHeader
            className="min-w-0 flex-1"
            headingId="water-goal-heading"
            headingLevel={3}
            title="Daily water goal"
            description={hasGoal
              ? 'Update the current goal used for all hydration summaries.'
              : 'Set a personal daily goal to enable hydration progress.'}
            actions={(
              <StatusBadge tone={hasGoal ? 'hydration' : 'neutral'}>
                {hasGoal ? 'Goal configured' : 'Not configured'}
              </StatusBadge>
            )}
          />
        </div>

        <Field className="mt-5" label="Configured goal (ml)" required hint="Enter a positive whole number of millilitres.">
          {(controlProps) => (
            <input
              {...controlProps}
              className="min-h-11 w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-app-border-muted disabled:opacity-70"
              disabled={mutating}
              inputMode="numeric"
              min="1"
              step="1"
              type="number"
              value={dailyGoalMl}
              onChange={(event) => setDailyGoalMl(event.target.value)}
            />
          )}
        </Field>

        {error ? <Alert id="water-goal-error" className="mt-4" tone="error" title="Check the water goal">{error}</Alert> : null}

        <Button className="mt-5" disabled={mutating} fullWidth type="submit">
          {mutating ? 'Saving...' : hasGoal ? 'Update daily goal' : 'Save daily goal'}
        </Button>
      </form>
    </Card>
  )
}
