import { useEffect, useState } from 'react'
import type { ChallengeType, CoupleChallenge, CoupleChallengeRequest } from '../types/CoupleChallenge'
import { CHALLENGE_TYPE_LABELS } from '../types/CoupleChallenge'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface CoupleChallengeFormProps {
  editingChallenge: CoupleChallenge | null
  mutating: boolean
  participantUserProfileIds: readonly number[]
  onCancel: () => void
  onSubmit: (data: CoupleChallengeRequest) => Promise<CoupleChallenge>
}

function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CoupleChallengeForm({
  editingChallenge,
  mutating,
  participantUserProfileIds,
  onCancel,
  onSubmit,
}: CoupleChallengeFormProps) {
  const [title, setTitle] = useState('')
  const [challengeType, setChallengeType] = useState<ChallengeType>('ACTIVITY_MINUTES')
  const [startDate, setStartDate] = useState(getTodayLocalDate)
  const [endDate, setEndDate] = useState(getTodayLocalDate)
  const [targetValue, setTargetValue] = useState('1')
  const [sleepMinutes, setSleepMinutes] = useState('420')
  const [customUnit, setCustomUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (editingChallenge) {
      setTitle(editingChallenge.title)
      setChallengeType(editingChallenge.challengeType)
      setStartDate(editingChallenge.startDate)
      setEndDate(editingChallenge.endDate)
      setTargetValue(String(editingChallenge.targetValue))
      setSleepMinutes(String(editingChallenge.qualifyingSleepMinutes ?? 420))
      setCustomUnit(editingChallenge.customUnit ?? '')
      setNotes(editingChallenge.notes ?? '')
    } else {
      const today = getTodayLocalDate()
      setTitle('')
      setChallengeType('ACTIVITY_MINUTES')
      setStartDate(today)
      setEndDate(today)
      setTargetValue('1')
      setSleepMinutes('420')
      setCustomUnit('')
      setNotes('')
    }
    setFormError(null)
  }, [editingChallenge])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const numericTarget = Number(targetValue)
    const numericSleepMinutes = Number(sleepMinutes)
    if (participantUserProfileIds.length !== 2 || participantUserProfileIds[0] === participantUserProfileIds[1]) {
      setFormError('Exactly two distinct profiles are required.')
      return
    }
    if (!Number.isInteger(numericTarget) || numericTarget <= 0) {
      setFormError('Target value must be a positive whole number.')
      return
    }
    if (challengeType === 'SLEEP_TARGET_DAYS'
      && (!Number.isInteger(numericSleepMinutes) || numericSleepMinutes < 1)) {
      setFormError('Sleep target minutes must be a positive whole number.')
      return
    }

    try {
      await onSubmit({
        title,
        challengeType,
        startDate,
        endDate,
        targetValue: numericTarget,
        qualifyingSleepMinutes: challengeType === 'SLEEP_TARGET_DAYS' ? numericSleepMinutes : null,
        customUnit: challengeType === 'CUSTOM_CHECK_IN' ? customUnit || null : null,
        participantUserProfileIds: [...participantUserProfileIds],
        notes: notes || null,
      })
    } catch {
      // The shared-challenges panel presents API errors from the shared hook.
    }
  }

  const inputClass = 'min-h-11 w-full min-w-0 rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm text-app-primary shadow-sm focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-app-border-muted disabled:text-app-secondary'

  return (
    <Card padding="normal" className="min-w-0 border-profile-shared/30 bg-app-surface">
      <div className="flex min-w-0 items-start gap-3">
        <IconContainer aria-hidden="true" tone="shared">
          <TrackingIcon name={editingChallenge ? 'shared' : 'plus'} />
        </IconContainer>
        <SectionHeader
          className="min-w-0 flex-1"
          headingId="couple-challenge-form-heading"
          headingLevel={3}
          title={editingChallenge ? 'Edit shared challenge' : 'Create shared challenge'}
          description={editingChallenge
            ? 'Challenge type and participant membership remain fixed while editing.'
            : 'Both loaded profiles participate automatically.'}
          actions={(
            <StatusBadge tone="profile-shared">
              {editingChallenge ? 'Editing challenge' : 'Two participants'}
            </StatusBadge>
          )}
        />
      </div>
      <form
        className="mt-5 space-y-5"
        aria-describedby={formError ? 'couple-challenge-form-error' : undefined}
        aria-labelledby="couple-challenge-form-heading"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Title" required hint="Use a clear title up to 100 characters.">
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} />
            )}
          </Field>
          <Field label="Challenge type" required hint={editingChallenge ? 'Challenge type cannot be changed after creation.' : undefined}>
            {(controlProps) => (
              <select {...controlProps} className={inputClass} disabled={mutating || editingChallenge !== null} value={challengeType} onChange={(event) => setChallengeType(event.target.value as ChallengeType)}>
                {Object.entries(CHALLENGE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            )}
          </Field>
          <Field label="Target value" required hint="Enter a positive whole number.">
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} min="1" step="1" type="number" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
            )}
          </Field>
          <Field label="Start date" required>
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            )}
          </Field>
          <Field label="End date" required hint="The end date must be on or after the start date.">
            {(controlProps) => (
              <input {...controlProps} className={inputClass} disabled={mutating} min={startDate} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            )}
          </Field>
          {challengeType === 'SLEEP_TARGET_DAYS' ? (
            <Field label="Qualifying sleep minutes" required hint="Enter a whole number from 1 to 1,440.">
              {(controlProps) => (
                <input {...controlProps} className={inputClass} disabled={mutating} max="1440" min="1" step="1" type="number" value={sleepMinutes} onChange={(event) => setSleepMinutes(event.target.value)} />
              )}
            </Field>
          ) : null}
          {challengeType === 'CUSTOM_CHECK_IN' ? (
            <Field label="Custom unit" optional hint="Up to 30 characters.">
              {(controlProps) => (
                <input {...controlProps} className={inputClass} disabled={mutating} maxLength={30} value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} />
              )}
            </Field>
          ) : null}
          <Field className="sm:col-span-2" label="Notes" optional hint="Up to 500 characters.">
            {(controlProps) => (
              <textarea {...controlProps} className={inputClass} disabled={mutating} maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            )}
          </Field>
        </div>
        {formError ? <Alert id="couple-challenge-form-error" tone="error" title="Unable to save challenge">{formError}</Alert> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" disabled={mutating} onClick={onCancel}>
            {editingChallenge ? 'Cancel edit' : 'Cancel'}
          </Button>
          <Button className="w-full sm:w-auto" disabled={mutating} type="submit">
            {mutating ? 'Saving challenge...' : editingChallenge ? 'Save challenge changes' : 'Create challenge'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
