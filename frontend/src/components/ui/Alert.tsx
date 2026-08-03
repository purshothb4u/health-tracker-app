import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

export type AlertTone = 'error' | 'warning' | 'success' | 'information'

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone
  title?: ReactNode
  action?: ReactNode
}

const toneClasses: Record<AlertTone, string> = {
  error: 'border-error-border bg-error-surface text-error',
  warning: 'border-warning-border bg-warning-surface text-warning',
  success: 'border-success-border bg-success-surface text-success',
  information: 'border-information-border bg-information-surface text-information',
}

const toneLabels: Record<AlertTone, string> = {
  error: 'Error',
  warning: 'Warning',
  success: 'Success',
  information: 'Information',
}

export function Alert({
  tone = 'information',
  title,
  action,
  children,
  className,
  role,
  ...props
}: AlertProps) {
  const resolvedRole = role ?? (tone === 'error' ? 'alert' : 'status')

  return (
    <div
      role={resolvedRole}
      aria-live={props['aria-live'] ?? (tone === 'error' ? 'assertive' : 'polite')}
      className={classNames(
        'rounded-xl border px-4 py-3 text-sm leading-6',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 break-words">
          <p className="font-semibold">{title ?? toneLabels[tone]}</p>
          {children ? <div className="mt-1 whitespace-pre-wrap break-words">{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
