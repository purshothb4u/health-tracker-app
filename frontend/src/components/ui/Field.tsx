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
    <div
      className={classNames(
        'min-w-0',
        '[&_input]:rounded-control [&_select]:rounded-control [&_textarea]:rounded-control',
        '[&_input]:transition-[border-color,box-shadow] [&_select]:transition-[border-color,box-shadow] [&_textarea]:transition-[border-color,box-shadow]',
        '[&_input:focus-visible]:border-focus [&_select:focus-visible]:border-focus [&_textarea:focus-visible]:border-focus',
        '[&_input:focus-visible]:ring-2 [&_select:focus-visible]:ring-2 [&_textarea:focus-visible]:ring-2',
        '[&_input:focus-visible]:ring-focus [&_select:focus-visible]:ring-focus [&_textarea:focus-visible]:ring-focus',
        '[&_input[aria-invalid=true]]:border-error [&_select[aria-invalid=true]]:border-error [&_textarea[aria-invalid=true]]:border-error',
        '[&_input[aria-invalid=true]:focus-visible]:ring-error [&_select[aria-invalid=true]:focus-visible]:ring-error [&_textarea[aria-invalid=true]:focus-visible]:ring-error',
        className,
      )}
      {...props}
    >
      <label
        htmlFor={resolvedControlId}
        className="block text-label text-app-primary"
      >
        {label}
        {required ? (
          <span className="ml-1 text-metadata font-medium text-app-secondary">(required)</span>
        ) : optional ? (
          <span className="ml-1 text-metadata font-medium text-app-secondary">(optional)</span>
        ) : null}
      </label>
      <div className="mt-1.5">
        {typeof children === 'function' ? children(controlProps) : children}
      </div>
      {hint ? (
        <p id={hintId} className="mt-1.5 break-words text-metadata text-app-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 break-words text-metadata font-medium text-error">
          <span className="font-semibold">Error:</span> {error}
        </p>
      ) : null}
    </div>
  )
}
