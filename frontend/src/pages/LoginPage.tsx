import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'

interface LoginErrors {
  email?: string
  password?: string
}

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

interface LoginPageProps {
  destination: string
}

export default function LoginPage({ destination }: LoginPageProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) {
      return
    }

    const nextErrors: LoginErrors = {}
    const normalizedEmail = email.trim()
    if (normalizedEmail.length === 0) {
      nextErrors.email = 'Enter your email address.'
    }
    if (password.length === 0) {
      nextErrors.password = 'Enter your password.'
    }

    setErrors(nextErrors)
    setApiError(null)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      const identity = await login({ email: normalizedEmail, password })
      navigate(identity.profileComplete ? destination : '/onboarding', { replace: true })
    } catch (error) {
      setApiError(
        error instanceof ApiError
          ? error.message
          : 'Unable to sign in. Please try again.',
      )
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

        <Card as="section" elevated padding="normal" aria-labelledby="login-heading">
          <div className="text-center">
            <p className="text-label uppercase tracking-[0.14em] text-primary-700">
              Welcome back
            </p>
            <h1 id="login-heading" className="mt-2 text-page-title text-app-primary">
              Sign in
            </h1>
            <p className="mt-2 text-supporting text-app-secondary">
              Continue to your personal health dashboard.
            </p>
          </div>

          <form
            className="mt-6 space-y-5"
            aria-describedby={apiError ? 'login-api-error' : undefined}
            noValidate
            onSubmit={handleSubmit}
          >
            {apiError ? (
              <Alert id="login-api-error" tone="error" title="Unable to sign in">
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

            <Field label="Password" required error={errors.password}>
              {(controlProps) => (
                <input
                  {...controlProps}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={submitting}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((current) => ({ ...current, password: undefined }))
                  }}
                  className="min-h-11 w-full border border-app-border bg-app-surface px-3 py-2.5 text-base text-app-primary disabled:bg-app-border-muted disabled:text-app-muted"
                />
              )}
            </Field>

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-supporting text-app-secondary">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center font-semibold text-primary hover:text-primary-hover"
            >
              Create account
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
