import type { HTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'

export type StatusBadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'information'
  | 'profile-husband'
  | 'profile-wife'

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone
}

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-success-border bg-success-surface text-success',
  warning: 'border-warning-border bg-warning-surface text-warning',
  error: 'border-error-border bg-error-surface text-error',
  information: 'border-information-border bg-information-surface text-information',
  'profile-husband': 'border-blue-200 bg-profile-husband-surface text-profile-husband',
  'profile-wife': 'border-pink-200 bg-profile-wife-surface text-profile-wife',
}

export function StatusBadge({
  tone = 'neutral',
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex max-w-full items-center rounded-full border px-2.5 py-1',
        'whitespace-normal break-words text-left text-xs font-semibold leading-4',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
