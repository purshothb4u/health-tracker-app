import type { HTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'

export type ProgressBarTone =
  | 'primary'
  | 'husband'
  | 'wife'
  | 'shared'
  | 'nutrition'
  | 'hydration'
  | 'activity'
  | 'sleep'

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'aria-label'> {
  value: number
  maximum: number
  label: string
  valueText?: string
  tone?: ProgressBarTone
}

const fillClasses: Record<ProgressBarTone, string> = {
  primary: 'bg-primary-600',
  husband: 'bg-profile-husband-accent',
  wife: 'bg-profile-wife-accent',
  shared: 'bg-profile-shared',
  nutrition: 'bg-metric-nutrition',
  hydration: 'bg-metric-hydration',
  activity: 'bg-metric-activity',
  sleep: 'bg-metric-sleep',
}

export function ProgressBar({
  value,
  maximum,
  label,
  valueText,
  tone = 'primary',
  className,
  ...props
}: ProgressBarProps) {
  const safeValue = Number.isFinite(value) ? value : 0
  const safeMaximum = Number.isFinite(maximum) && maximum > 0 ? maximum : 1
  const actualPercentage = (safeValue / safeMaximum) * 100
  const visualPercentage = Math.min(Math.max(actualPercentage, 0), 100)
  const accessibleValueText = valueText ?? `${Math.round(actualPercentage)}%`
  const accessibleValue = Math.min(Math.max(safeValue, 0), safeMaximum)

  return (
    <div className={classNames('min-w-0', className)} {...props}>
      <div className="mb-2 flex min-w-0 items-start justify-between gap-3 text-label">
        <span className="break-words font-medium text-app-primary">{label}</span>
        {valueText ? (
          <span className="shrink-0 font-semibold tabular-nums text-app-secondary">{valueText}</span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMaximum}
        aria-valuenow={accessibleValue}
        aria-valuetext={accessibleValueText}
        className="h-2.5 overflow-hidden rounded-full bg-app-border-muted ring-1 ring-inset ring-app-border/70"
      >
        <div
          aria-hidden="true"
          className={classNames(
            'h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none',
            fillClasses[tone],
          )}
          style={{ width: `${visualPercentage}%` }}
        />
      </div>
    </div>
  )
}
