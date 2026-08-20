import { useState, type InputHTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

function VisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M2.4 12s3.5-6 9.6-6 9.6 6 9.6 6-3.5 6-9.6 6-9.6-6-9.6-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {visible ? <path d="m4 4 16 16" /> : null}
    </svg>
  )
}

export function PasswordInput({
  className,
  disabled,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const actionLabel = visible ? 'Hide password' : 'Show password'

  return (
    <div className="relative min-w-0">
      <input
        {...props}
        id={id}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={classNames('pr-14', className)}
      />
      <button
        type="button"
        aria-controls={id}
        aria-label={actionLabel}
        aria-pressed={visible}
        title={actionLabel}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center rounded-r-control text-app-secondary transition-colors hover:bg-primary-50 hover:text-app-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
      >
        <VisibilityIcon visible={visible} />
      </button>
    </div>
  )
}
