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
  | 'profile-shared'
  | 'nutrition'
  | 'hydration'
  | 'activity'
  | 'sleep'

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone
}

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral: 'border-app-border bg-app-border-muted text-app-secondary',
  success: 'border-success-border bg-success-surface text-success',
  warning: 'border-warning-border bg-warning-surface text-warning',
  error: 'border-error-border bg-error-surface text-error',
  information: 'border-information-border bg-information-surface text-information',
  'profile-husband': 'border-profile-husband-accent/30 bg-profile-husband-surface text-app-primary',
  'profile-wife': 'border-profile-wife-accent/30 bg-profile-wife-surface text-app-primary',
  'profile-shared': 'border-profile-shared/35 bg-profile-shared-surface text-app-primary',
  nutrition: 'border-metric-nutrition/35 bg-metric-nutrition-surface text-app-primary',
  hydration: 'border-metric-hydration/35 bg-metric-hydration-surface text-app-primary',
  activity: 'border-metric-activity/35 bg-metric-activity-surface text-app-primary',
  sleep: 'border-metric-sleep/35 bg-metric-sleep-surface text-app-primary',
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
        'whitespace-normal break-words text-left text-metadata font-semibold',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
