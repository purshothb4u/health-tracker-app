import type { HTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  message?: string
  compact?: boolean
}

export function LoadingState({
  message = 'Loading…',
  compact = false,
  className,
  role,
  ...props
}: LoadingStateProps) {
  return (
    <div
      role={role ?? 'status'}
      aria-live={props['aria-live'] ?? 'polite'}
      aria-busy="true"
      className={classNames(
        'flex items-center gap-3 text-app-secondary',
        compact ? 'py-2 text-sm' : 'justify-center rounded-card border border-app-border bg-app-surface px-5 py-8',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-primary-600 motion-reduce:animate-none"
      />
      <span className="break-words">{message}</span>
    </div>
  )
}
