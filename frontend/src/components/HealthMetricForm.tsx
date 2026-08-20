import { useEffect, useId, useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { createHealthMetric, updateHealthMetric } from '../api/healthMetricApi'
import type { HealthMetric, HealthMetricRequest } from '../types/HealthMetric'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface HealthMetricFormProps {
  userProfileId: number
  metrics: HealthMetric[]
  onSaved: () => void
}

const inputClasses = [
  'min-h-11 w-full rounded-control border border-app-border bg-app-surface px-3 py-2',
  'text-app-primary shadow-sm outline-none placeholder:text-app-muted',
  'focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus',
  'disabled:cursor-not-allowed disabled:bg-app-border-muted disabled:text-app-secondary',
].join(' ')

function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function HealthMetricForm({
  userProfileId,
  metrics,
  onSaved,
}: HealthMetricFormProps) {
  const headingId = useId()
  const todayDate = getTodayDate()
  const todayMetric = metrics.find((metric) => metric.metricDate === todayDate)
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    setWeightKg(todayMetric ? String(todayMetric.weightKg) : '')
    setNotes(todayMetric?.notes ?? '')
    setValidationError(null)
    setApiError(null)
  }, [todayMetric])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedWeightKg = Number(weightKg)
    if (!Number.isFinite(parsedWeightKg) || parsedWeightKg <= 0) {
      setValidationError('Enter a positive weight in kilograms.')
      setSuccessMessage(null)
      return
    }

    const data: HealthMetricRequest = {
      metricDate: todayDate,
      weightKg: parsedWeightKg,
      notes: notes.trim() || undefined,
    }

    const updatingExistingMetric = todayMetric !== undefined
    setSaving(true)
    setValidationError(null)
    setApiError(null)
    setSuccessMessage(null)

    try {
      if (todayMetric) {
        await updateHealthMetric(userProfileId, todayMetric.id, data)
      } else {
        await createHealthMetric(userProfileId, data)
      }
      setSuccessMessage(
        updatingExistingMetric ? "Today's weight updated." : "Today's weight saved.",
      )
      onSaved()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to save today's weight")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      as="section"
      padding="normal"
      aria-labelledby={headingId}
      className={todayMetric ? 'border-information-border bg-information-surface/20' : undefined}
    >
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="primary">
          <TrackingIcon name="plus" />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId={headingId}
          headingLevel={2}
          title="Today's weight"
          description={todayMetric
            ? "A weight entry already exists for today. Saving will update that entry."
            : 'Record a new weight entry for today.'}
          actions={(
            <StatusBadge tone={todayMetric ? 'information' : 'neutral'}>
              {todayMetric ? 'Editing today' : 'New entry'}
            </StatusBadge>
          )}
        />
      </div>

      <form className="mt-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <Field
            label="Weight (kg)"
            required
            error={validationError}
            hint="Enter a positive value in kilograms."
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                className={inputClasses}
                disabled={saving}
                inputMode="decimal"
                min="0.1"
                step="0.01"
                type="number"
                value={weightKg}
                onChange={(event) => {
                  setWeightKg(event.target.value)
                  setValidationError(null)
                  setSuccessMessage(null)
                }}
              />
            )}
          </Field>

          <Field label="Notes" optional hint="Up to 500 characters.">
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                className={`${inputClasses} min-h-24 resize-y`}
                disabled={saving}
                maxLength={500}
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value)
                  setSuccessMessage(null)
                }}
              />
            )}
          </Field>
        </div>

        {apiError ? (
          <Alert className="mt-4" tone="error" title="Weight could not be saved">
            {apiError}
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert className="mt-4" tone="success">
            {successMessage}
          </Alert>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={saving} fullWidth className="sm:w-auto">
            {saving
              ? 'Saving weight...'
              : todayMetric
                ? "Update today's weight"
                : "Save today's weight"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
