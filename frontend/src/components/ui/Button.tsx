import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive'
export type ButtonSize = 'normal' | 'compact'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:bg-primary-600',
  secondary:
    'border-app-border bg-app-surface text-app-primary shadow-sm hover:bg-slate-50',
  quiet:
    'border-transparent bg-transparent text-app-secondary hover:bg-slate-100 hover:text-app-primary',
  destructive:
    'border-transparent bg-error text-white shadow-sm hover:bg-red-800 disabled:bg-error',
}

const sizeClasses: Record<ButtonSize, string> = {
  normal: 'min-h-11 px-4 py-2.5 text-sm',
  compact: 'min-h-9 px-3 py-1.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    type = 'button',
    variant = 'primary',
    size = 'normal',
    fullWidth = false,
    className,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold leading-5',
        'transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
})
