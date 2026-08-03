import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

type CardElement = 'article' | 'div' | 'section'
type CardPadding = 'none' | 'compact' | 'normal'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: CardElement
  padding?: CardPadding
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  compact: 'p-4',
  normal: 'p-5 sm:p-6',
}

export function Card({
  as: Component = 'div',
  padding = 'none',
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={classNames(
        'rounded-card border border-app-border bg-app-surface shadow-card',
        paddingClasses[padding],
        className,
      )}
      {...props}
    />
  )
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Exclude<CardPadding, 'none'>
}

export function CardHeader({
  padding = 'normal',
  className,
  ...props
}: CardSectionProps) {
  return (
    <div
      className={classNames(
        padding === 'compact' ? 'px-4 pt-4' : 'px-5 pt-5 sm:px-6 sm:pt-6',
        className,
      )}
      {...props}
    />
  )
}

export function CardContent({
  padding = 'normal',
  className,
  ...props
}: CardSectionProps) {
  return (
    <div
      className={classNames(padding === 'compact' ? 'p-4' : 'p-5 sm:p-6', className)}
      {...props}
    />
  )
}

export function CardFooter({
  padding = 'normal',
  className,
  ...props
}: CardSectionProps) {
  return (
    <div
      className={classNames(
        'border-t border-app-border',
        padding === 'compact' ? 'px-4 py-3' : 'px-5 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  )
}

export interface SummaryCardProps extends Omit<CardProps, 'children'> {
  label: ReactNode
  value: ReactNode
  supportingText?: ReactNode
  action?: ReactNode
}

export function SummaryCard({
  label,
  value,
  supportingText,
  action,
  className,
  ...props
}: SummaryCardProps) {
  return (
    <Card padding="normal" className={classNames('min-w-0', className)} {...props}>
      <p className="text-sm font-medium text-app-secondary">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-app-primary">
        {value}
      </p>
      {supportingText ? (
        <div className="mt-2 break-words text-sm leading-6 text-app-secondary">
          {supportingText}
        </div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}
