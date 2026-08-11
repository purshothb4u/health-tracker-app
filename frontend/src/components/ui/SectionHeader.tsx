import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

type SectionHeadingLevel = 2 | 3 | 4 | 5 | 6

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  headingLevel?: SectionHeadingLevel
  headingId?: string
}

export function SectionHeader({
  title,
  description,
  actions,
  headingLevel = 2,
  headingId,
  className,
  ...props
}: SectionHeaderProps) {
  const generatedHeadingId = useId()
  const resolvedHeadingId = headingId ?? generatedHeadingId
  const Heading = `h${headingLevel}` as const

  return (
    <div
      className={classNames(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <Heading
          id={resolvedHeadingId}
          className="break-words text-section-title text-app-primary"
        >
          {title}
        </Heading>
        {description ? (
          <div className="mt-1.5 break-words text-supporting text-app-secondary">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
