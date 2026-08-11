import type { HTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'

export type IconContainerTone =
  | 'neutral'
  | 'primary'
  | 'husband'
  | 'wife'
  | 'shared'
  | 'nutrition'
  | 'hydration'
  | 'activity'
  | 'sleep'
  | 'success'
  | 'warning'
  | 'error'
  | 'information'

export type IconContainerSize = 'small' | 'normal' | 'large'

export interface IconContainerProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: IconContainerTone
  size?: IconContainerSize
}

const toneClasses: Record<IconContainerTone, string> = {
  neutral: 'bg-app-border-muted text-app-secondary ring-app-border',
  primary: 'bg-primary-50 text-primary-700 ring-primary-100',
  husband: 'bg-profile-husband-surface text-profile-husband-accent ring-profile-husband-accent/20',
  wife: 'bg-profile-wife-surface text-profile-wife-accent ring-profile-wife-accent/20',
  shared: 'bg-profile-shared-surface text-profile-shared ring-profile-shared/25',
  nutrition: 'bg-metric-nutrition-surface text-metric-nutrition ring-metric-nutrition/20',
  hydration: 'bg-metric-hydration-surface text-metric-hydration ring-metric-hydration/20',
  activity: 'bg-metric-activity-surface text-metric-activity ring-metric-activity/20',
  sleep: 'bg-metric-sleep-surface text-metric-sleep ring-metric-sleep/20',
  success: 'bg-success-surface text-success ring-success-border',
  warning: 'bg-warning-surface text-warning ring-warning-border',
  error: 'bg-error-surface text-error ring-error-border',
  information: 'bg-information-surface text-information ring-information-border',
}

const sizeClasses: Record<IconContainerSize, string> = {
  small: 'h-8 w-8 rounded-lg [&>svg]:h-4 [&>svg]:w-4',
  normal: 'h-10 w-10 rounded-control [&>svg]:h-5 [&>svg]:w-5',
  large: 'h-12 w-12 rounded-card [&>svg]:h-6 [&>svg]:w-6',
}

export function IconContainer({
  tone = 'neutral',
  size = 'normal',
  className,
  ...props
}: IconContainerProps) {
  return (
    <span
      className={classNames(
        'inline-flex shrink-0 items-center justify-center ring-1 ring-inset',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
