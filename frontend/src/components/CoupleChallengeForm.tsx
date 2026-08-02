import { useEffect, useState } from 'react'
import type { ChallengeType, CoupleChallenge, CoupleChallengeRequest } from '../types/CoupleChallenge'
import { CHALLENGE_TYPE_LABELS } from '../types/CoupleChallenge'

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
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save couple challenge.')
    }
  }

  const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900'

  return (
    <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-900">{editingChallenge ? 'Edit couple challenge' : 'Create couple challenge'}</h4>
          <p className="mt-1 text-xs text-gray-500">Husband and Wife participate automatically.</p>
        </div>
        <button className="text-sm font-medium text-gray-600 hover:text-gray-900" type="button" onClick={onCancel}>Close</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700 sm:col-span-2">
          Title
          <input className={inputClass} disabled={mutating} maxLength={100} required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Challenge type
          <select className={inputClass} disabled={mutating || editingChallenge !== null} value={challengeType} onChange={(event) => setChallengeType(event.target.value as ChallengeType)}>
            {Object.entries(CHALLENGE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Target value
          <input className={inputClass} disabled={mutating} min="1" required step="1" type="number" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Start date
          <input className={inputClass} disabled={mutating} required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          End date
          <input className={inputClass} disabled={mutating} min={startDate} required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        {challengeType === 'SLEEP_TARGET_DAYS' && (
          <label className="text-sm font-medium text-gray-700">
            Sleep target minutes
            <input className={inputClass} disabled={mutating} max="1440" min="1" required step="1" type="number" value={sleepMinutes} onChange={(event) => setSleepMinutes(event.target.value)} />
          </label>
        )}
        {challengeType === 'CUSTOM_CHECK_IN' && (
          <label className="text-sm font-medium text-gray-700">
            Custom unit (optional)
            <input className={inputClass} disabled={mutating} maxLength={30} value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} />
          </label>
        )}
        <label className="text-sm font-medium text-gray-700 sm:col-span-2">
          Notes (optional)
          <textarea className={inputClass} disabled={mutating} maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      {formError && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{formError}</p>}
      <button className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 sm:w-auto" disabled={mutating} type="submit">
        {editingChallenge ? 'Save changes' : 'Create challenge'}
      </button>
    </form>
  )
}
