import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import {
  fetchProfileOnboarding,
  saveProfileOnboarding,
} from '../api/profileOnboardingApi'
import AuthenticatedAccountControls from '../components/layout/AuthenticatedAccountControls'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { IconContainer } from '../components/ui/IconContainer'
import { LoadingState } from '../components/ui/LoadingState'
import { useAuth } from '../context/AuthContext'
import type {
  ProfileOnboarding,
  ProfileOnboardingRequest,
} from '../types/ProfileOnboarding'
import type { ActivityLevel, Gender, ProfileGoalType } from '../types/UserProfile'

interface FormValues {
  displayName: string
  sex: Gender | ''
  dateOfBirth: string
  heightCm: string
  currentWeightKg: string
  targetWeightKg: string
  activityLevel: ActivityLevel | ''
  goalType: ProfileGoalType | ''
}

type FieldName = keyof FormValues
type FormErrors = Partial<Record<FieldName, string>>

const EMPTY_FORM: FormValues = {
  displayName: '',
  sex: '',
  dateOfBirth: '',
  heightCm: '',
  currentWeightKg: '',
  targetWeightKg: '',
  activityLevel: '',
  goalType: '',
}

const controlClasses = 'min-h-11 w-full min-w-0 max-w-full border border-app-border bg-app-surface px-3 py-2.5 text-base text-app-primary disabled:bg-app-border-muted disabled:text-app-muted read-only:bg-app-background read-only:text-app-secondary'

const activityOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: 'SEDENTARY', label: 'Sedentary' },
  { value: 'LIGHTLY_ACTIVE', label: 'Lightly active' },
  { value: 'MODERATELY_ACTIVE', label: 'Moderately active' },
  { value: 'VERY_ACTIVE', label: 'Very active' },
]

const goalOptions: Array<{ value: ProfileGoalType; label: string }> = [
  { value: 'LOSE_WEIGHT', label: 'Lose weight' },
  { value: 'MAINTAIN_WEIGHT', label: 'Maintain weight' },
  { value: 'GAIN_WEIGHT', label: 'Gain weight' },
]

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function yesterdayIso(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function valuesFromProfile(profile: ProfileOnboarding): FormValues {
  return {
    displayName: profile.displayName ?? '',
    sex: profile.sex ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    heightCm: profile.heightCm === null ? '' : String(profile.heightCm),
    currentWeightKg: profile.currentWeightKg === null ? '' : String(profile.currentWeightKg),
    targetWeightKg: profile.targetWeightKg === null ? '' : String(profile.targetWeightKg),
    activityLevel: profile.activityLevel ?? '',
    goalType: profile.goalType ?? '',
  }
}

function positiveNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export default function OnboardingPage() {
  const { identity, refreshIdentity } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileOnboarding | null>(null)
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setLoadError(null)
      try {
        const loadedProfile = await fetchProfileOnboarding()
        if (!cancelled) {
          setProfile(loadedProfile)
          setValues(valuesFromProfile(loadedProfile))
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message
              : 'Unable to load your profile setup.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSaveError(null)
  }

  function validate(): { errors: FormErrors; request: ProfileOnboardingRequest | null } {
    const nextErrors: FormErrors = {}
    const displayName = values.displayName.trim()
    const heightCm = positiveNumber(values.heightCm)
    const currentWeightKg = positiveNumber(values.currentWeightKg)
    const targetWeightKg = positiveNumber(values.targetWeightKg)

    if (!displayName) nextErrors.displayName = 'Enter your name.'
    else if (displayName.length > 100) nextErrors.displayName = 'Use 100 characters or fewer.'
    if (!values.sex) nextErrors.sex = 'Select your sex.'
    if (!values.dateOfBirth) nextErrors.dateOfBirth = 'Enter your date of birth.'
    else if (values.dateOfBirth > yesterdayIso()) {
      nextErrors.dateOfBirth = 'Date of birth must be in the past.'
    }
    if (heightCm === null) nextErrors.heightCm = 'Enter a positive height.'
    if (currentWeightKg === null) nextErrors.currentWeightKg = 'Enter a positive current weight.'
    if (targetWeightKg === null) nextErrors.targetWeightKg = 'Enter a positive target weight.'
    if (!values.activityLevel) nextErrors.activityLevel = 'Select your activity level.'
    if (!values.goalType) nextErrors.goalType = 'Select your goal.'

    if (Object.keys(nextErrors).length > 0
      || !values.sex || !values.activityLevel || !values.goalType
      || heightCm === null || currentWeightKg === null || targetWeightKg === null) {
      return { errors: nextErrors, request: null }
    }

    return {
      errors: nextErrors,
      request: {
        displayName,
        sex: values.sex,
        dateOfBirth: values.dateOfBirth,
        heightCm,
        currentWeightKg,
        targetWeightKg,
        activityLevel: values.activityLevel,
        goalType: values.goalType,
      },
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const validation = validate()
    setErrors(validation.errors)
    setSaveError(null)
    if (validation.request === null) return

    setSubmitting(true)
    try {
      const savedProfile = await saveProfileOnboarding(validation.request)
      setProfile(savedProfile)
      setValues(valuesFromProfile(savedProfile))
      const refreshedIdentity = await refreshIdentity()
      if (!refreshedIdentity.profileComplete) {
        setSaveError('Your profile was saved, but required setup information is still missing.')
        return
      }
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors ?? {}
        setErrors((current) => ({ ...current, ...fieldErrors }))
        setSaveError(error.message)
      } else {
        setSaveError('Unable to save your profile. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-app-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary text-lg text-white shadow-card">
              ♥
            </span>
            <div className="min-w-0">
              <p className="truncate text-card-title text-app-primary">HealthAITracker</p>
              <p className="hidden truncate text-metadata text-app-muted min-[390px]:block">
                Personal health, shared support
              </p>
            </div>
          </div>
          <AuthenticatedAccountControls compact />
        </header>

        <div className="mx-auto mt-8 max-w-3xl sm:mt-10">
          <div className="mb-6 flex min-w-0 items-start gap-3">
            <IconContainer tone="primary" size="large"><ProfileIcon /></IconContainer>
            <div className="min-w-0">
              <p className="text-label uppercase tracking-[0.14em] text-primary-700">Profile setup</p>
              <h1 className="mt-1 break-words text-page-title text-app-primary">
                Tell us about yourself
              </h1>
              <p className="mt-2 text-supporting text-app-secondary">
                Complete your personal profile before continuing to the health dashboard.
              </p>
            </div>
          </div>

          {loading ? <LoadingState message="Loading your profile setup…" /> : null}
          {!loading && loadError ? (
            <Alert
              tone="error"
              title="Unable to load profile setup"
              action={<Button variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>Retry</Button>}
            >
              {loadError}
            </Alert>
          ) : null}

          {!loading && profile ? (
            <Card as="section" elevated padding="normal" aria-labelledby="profile-form-heading">
              <h2 id="profile-form-heading" className="text-section-title text-app-primary">
                {profile.profileComplete ? 'Update your profile' : `Welcome, ${identity?.displayName ?? 'there'}`}
              </h2>
              <p className="mt-1.5 text-supporting text-app-secondary">
                Required details are used for your personal health calculations. Nutrition targets are not calculated yet.
              </p>

              <form
                className="mt-6 space-y-6"
                noValidate
                aria-describedby={saveError ? 'profile-save-error' : undefined}
                onSubmit={handleSubmit}
              >
                {saveError ? (
                  <Alert id="profile-save-error" tone="error" title="Unable to save profile">
                    {saveError}
                  </Alert>
                ) : null}

                <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                  <Field label="Name" required error={errors.displayName}>
                    {(controlProps) => (
                      <input {...controlProps} className={controlClasses} type="text" autoComplete="name" maxLength={100} disabled={submitting} value={values.displayName} onChange={(event) => updateField('displayName', event.target.value)} />
                    )}
                  </Field>

                  <Field label="Sex" required error={errors.sex}>
                    {(controlProps) => (
                      <select {...controlProps} className={controlClasses} disabled={submitting} value={values.sex} onChange={(event) => updateField('sex', event.target.value)}>
                        <option value="">Select sex</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other / prefer not to say</option>
                      </select>
                    )}
                  </Field>

                  <Field label="Date of birth" required error={errors.dateOfBirth} hint="Your age is derived from this date.">
                    {(controlProps) => (
                      <input {...controlProps} className={controlClasses} type="date" max={yesterdayIso()} disabled={submitting} value={values.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} />
                    )}
                  </Field>

                  <Field label="Height" required error={errors.heightCm} hint="Centimetres (cm)">
                    {(controlProps) => (
                      <input {...controlProps} className={controlClasses} type="number" min="0.01" step="0.1" inputMode="decimal" disabled={submitting} value={values.heightCm} onChange={(event) => updateField('heightCm', event.target.value)} />
                    )}
                  </Field>

                  <Field
                    label="Current weight"
                    required
                    error={errors.currentWeightKg}
                    hint={profile.hasWeightHistory ? 'Managed by your latest Health entry.' : 'Kilograms (kg). Saving creates your first Health entry.'}
                  >
                    {(controlProps) => (
                      <input {...controlProps} className={controlClasses} type="number" min="0.01" step="0.01" inputMode="decimal" readOnly={profile.hasWeightHistory} aria-readonly={profile.hasWeightHistory || undefined} disabled={submitting} value={values.currentWeightKg} onChange={(event) => updateField('currentWeightKg', event.target.value)} />
                    )}
                  </Field>

                  <Field label="Target weight" required error={errors.targetWeightKg} hint="Kilograms (kg)">
                    {(controlProps) => (
                      <input {...controlProps} className={controlClasses} type="number" min="0.01" step="0.01" inputMode="decimal" disabled={submitting} value={values.targetWeightKg} onChange={(event) => updateField('targetWeightKg', event.target.value)} />
                    )}
                  </Field>

                  <Field label="Activity level" required error={errors.activityLevel}>
                    {(controlProps) => (
                      <select {...controlProps} className={controlClasses} disabled={submitting} value={values.activityLevel} onChange={(event) => updateField('activityLevel', event.target.value)}>
                        <option value="">Select activity level</option>
                        {activityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    )}
                  </Field>

                  <Field label="Goal" required error={errors.goalType}>
                    {(controlProps) => (
                      <select {...controlProps} className={controlClasses} disabled={submitting} value={values.goalType} onChange={(event) => updateField('goalType', event.target.value)}>
                        <option value="">Select goal</option>
                        {goalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    )}
                  </Field>
                </div>

                <div className="border-t border-app-border-muted pt-5">
                  <Button type="submit" fullWidth disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save and continue'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  )
}
