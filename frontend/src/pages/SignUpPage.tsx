import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'

interface SignUpErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

const MINIMUM_PASSWORD_LENGTH = 12
const MAXIMUM_PASSWORD_LENGTH = 72

function BrandHeartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 6.9l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z" />
    </svg>
  )
}

export default function SignUpPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<SignUpErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const nextErrors: SignUpErrors = {}
    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      nextErrors.email = 'Enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      nextErrors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`
    } else if (password.length > MAXIMUM_PASSWORD_LENGTH) {
      nextErrors.password = `Use no more than ${MAXIMUM_PASSWORD_LENGTH} characters.`
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.'
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    setApiError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await register({ email: normalizedEmail, password })
      navigate('/onboarding', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors ?? {}
        setErrors((current) => ({
          ...current,
          email: fieldErrors.email ?? current.email,
          password: fieldErrors.password ?? current.password,
        }))
        setApiError(error.message)
      } else {
        setApiError('Unable to create your account. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-background px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-card bg-primary text-white shadow-elevated"
          >
            <BrandHeartIcon />
          </span>
          <p className="mt-4 text-card-title tracking-[-0.025em] text-app-primary">
            HealthAITracker
          </p>
          <p className="mt-1 text-supporting text-app-secondary">
            Personal health, shared support
          </p>
        </div>

        <Card as="section" elevated padding="normal" aria-labelledby="signup-heading">
          <div className="text-center">
            <p className="text-label uppercase tracking-[0.14em] text-primary-700">
              Get started
            </p>
            <h1 id="signup-heading" className="mt-2 text-page-title text-app-primary">
              Create account
            </h1>
            <p className="mt-2 text-supporting text-app-secondary">
              Set up your private account, then complete your health profile.
            </p>
          </div>

          <form
            className="mt-6 space-y-5"
            aria-describedby={apiError ? 'signup-api-error' : undefined}
            noValidate
            onSubmit={handleSubmit}
          >
            {apiError ? (
              <Alert id="signup-api-error" tone="error" title="Unable to create account">
                {apiError}
              </Alert>
            ) : null}

            <Field label="Email" required error={errors.email}>
              {(controlProps) => (
                <input
                  {...controlProps}
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  disabled={submitting}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrors((current) => ({ ...current, email: undefined }))
                  }}
                  className="min-h-11 w-full border border-app-border bg-app-surface px-3 py-2.5 text-base text-app-primary disabled:bg-app-border-muted disabled:text-app-muted"
                />
              )}
            </Field>

            <Field
              label="Password"
              required
              error={errors.password}
              hint={`${MINIMUM_PASSWORD_LENGTH} to ${MAXIMUM_PASSWORD_LENGTH} characters.`}
            >
              {(controlProps) => (
                <input
                  {...controlProps}
                  type="password"
                  autoComplete="new-password"
                  minLength={MINIMUM_PASSWORD_LENGTH}
                  maxLength={MAXIMUM_PASSWORD_LENGTH}
                  value={password}
                  disabled={submitting}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                      confirmPassword: undefined,
                    }))
                  }}
                  className="min-h-11 w-full border border-app-border bg-app-surface px-3 py-2.5 text-base text-app-primary disabled:bg-app-border-muted disabled:text-app-muted"
                />
              )}
            </Field>

            <Field label="Confirm password" required error={errors.confirmPassword}>
              {(controlProps) => (
                <input
                  {...controlProps}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  disabled={submitting}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setErrors((current) => ({ ...current, confirmPassword: undefined }))
                  }}
                  className="min-h-11 w-full border border-app-border bg-app-surface px-3 py-2.5 text-base text-app-primary disabled:bg-app-border-muted disabled:text-app-muted"
                />
              )}
            </Field>

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-supporting text-app-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center font-semibold text-primary hover:text-primary-hover"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
