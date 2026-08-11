import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

type PageHeadingLevel = 1 | 2 | 3

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  headingLevel?: PageHeadingLevel
  headingId?: string
}

export function PageHeader({
  title,
  description,
  actions,
  headingLevel = 1,
  headingId,
  className,
  ...props
}: PageHeaderProps) {
  const Heading = `h${headingLevel}` as const

  return (
    <header
      className={classNames(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <Heading
          id={headingId}
          className="break-words text-page-title text-app-primary"
        >
          {title}
        </Heading>
        {description ? (
          <div className="mt-2 max-w-3xl break-words text-supporting text-app-secondary sm:text-base">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
