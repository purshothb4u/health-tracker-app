import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

export interface FieldControlProps {
  id: string
  required?: true
  'aria-describedby'?: string
  'aria-invalid'?: true
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode
  controlId?: string
  required?: boolean
  optional?: boolean
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode | ((controlProps: FieldControlProps) => ReactNode)
}

export function Field({
  label,
  controlId,
  required = false,
  optional = false,
  hint,
  error,
  children,
  className,
  ...props
}: FieldProps) {
  const generatedId = useId()
  const resolvedControlId = controlId ?? `field-${generatedId}`
  const hintId = hint ? `${resolvedControlId}-hint` : undefined
  const errorId = error ? `${resolvedControlId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const controlProps: FieldControlProps = {
    id: resolvedControlId,
    required: required ? true : undefined,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
  }

  return (
    <div className={classNames('min-w-0', className)} {...props}>
      <label
        htmlFor={resolvedControlId}
        className="block text-sm font-semibold leading-5 text-app-primary"
      >
        {label}
        {required ? (
          <span className="ml-1 text-xs font-medium text-app-secondary">(required)</span>
        ) : optional ? (
          <span className="ml-1 text-xs font-medium text-app-secondary">(optional)</span>
        ) : null}
      </label>
      <div className="mt-1.5">
        {typeof children === 'function' ? children(controlProps) : children}
      </div>
      {hint ? (
        <p id={hintId} className="mt-1.5 break-words text-xs leading-5 text-app-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 break-words text-xs font-medium leading-5 text-error">
          <span className="font-semibold">Error:</span> {error}
        </p>
      ) : null}
    </div>
  )
}
