import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../utils/classNames'
import { IconContainer, type IconContainerTone } from './IconContainer'

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  iconTone?: IconContainerTone
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  iconTone = 'neutral',
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={classNames(
        'rounded-card border border-dashed border-app-border bg-app-border-muted/45 text-center',
        compact ? 'px-4 py-4' : 'px-5 py-8 sm:px-6',
        className,
      )}
      {...props}
    >
      {icon ? (
        <IconContainer aria-hidden="true" tone={iconTone} className="mx-auto mb-3">
          {icon}
        </IconContainer>
      ) : null}
      <p className="break-words text-card-title text-app-primary">{title}</p>
      {description ? (
        <div className="mx-auto mt-1.5 max-w-xl break-words text-supporting text-app-secondary">
          {description}
        </div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
