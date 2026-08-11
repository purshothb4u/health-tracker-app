import type { HTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'
import { IconContainer } from './IconContainer'

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
        'flex items-center gap-3 text-supporting text-app-secondary',
        compact
          ? 'py-2'
          : 'justify-center rounded-card border border-app-border-muted bg-app-surface px-5 py-8 shadow-card',
        className,
      )}
      {...props}
    >
      <IconContainer aria-hidden="true" tone="primary" size="small">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
      </IconContainer>
      <span className="break-words">{message}</span>
    </div>
  )
}
