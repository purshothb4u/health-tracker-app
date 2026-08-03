import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={classNames(
        'rounded-card border border-dashed border-app-border bg-slate-50 text-center',
        compact ? 'px-4 py-4' : 'px-5 py-8 sm:px-6',
        className,
      )}
      {...props}
    >
      <p className="break-words text-sm font-semibold text-app-primary">{title}</p>
      {description ? (
        <div className="mx-auto mt-1.5 max-w-xl break-words text-sm leading-6 text-app-secondary">
          {description}
        </div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
