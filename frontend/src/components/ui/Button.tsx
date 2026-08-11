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
    'border-transparent bg-primary text-white shadow-sm hover:bg-primary-hover active:bg-primary-pressed disabled:bg-primary',
  secondary:
    'border-app-border bg-app-surface text-app-primary shadow-sm hover:border-primary-100 hover:bg-primary-50 active:bg-primary-100',
  quiet:
    'border-transparent bg-transparent text-app-secondary hover:bg-primary-50 hover:text-app-primary active:bg-primary-100',
  destructive:
    'border-transparent bg-error text-white shadow-sm hover:bg-error-hover active:bg-error-pressed disabled:bg-error',
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
        'inline-flex items-center justify-center gap-2 rounded-control border font-semibold leading-5',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out',
        'active:translate-y-px motion-reduce:transform-none motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app-background',
        'disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
})
