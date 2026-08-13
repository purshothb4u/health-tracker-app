import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { classNames } from '../../utils/classNames'
import { Button } from '../ui/Button'

interface AuthenticatedAccountControlsProps {
  compact?: boolean
}

export default function AuthenticatedAccountControls({
  compact = false,
}: AuthenticatedAccountControlsProps) {
  const { identity, logout } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (identity === null) {
    return null
  }

  async function handleLogout() {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (logoutError) {
      setError(
        logoutError instanceof ApiError
          ? logoutError.message
          : 'Unable to log out. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const accountLabel = identity.displayName?.trim() || identity.email
  const initial = accountLabel.charAt(0).toUpperCase() || 'P'

  return (
    <div className={classNames('min-w-0', compact ? 'max-w-[9.5rem]' : 'w-full')}>
      <div className={classNames('flex min-w-0 items-center', compact ? 'gap-1.5' : 'gap-2.5')}>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100"
        >
          {initial}
        </span>
        {!compact ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-label text-app-primary">{accountLabel}</p>
            <p className="truncate text-metadata text-app-secondary">{identity.email}</p>
          </div>
        ) : (
          <span className="sr-only">Signed in as {accountLabel}</span>
        )}
        <Button
          variant="quiet"
          disabled={submitting}
          aria-label={submitting ? 'Logging out' : `Log out ${accountLabel}`}
          onClick={handleLogout}
          className={classNames('shrink-0', compact && 'px-2.5')}
        >
          {submitting ? 'Logging out…' : 'Log out'}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 break-words text-metadata font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
