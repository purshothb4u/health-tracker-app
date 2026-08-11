import { Link, useLocation } from 'react-router'
import { classNames } from '../../utils/classNames'
import { IconContainer, type IconContainerTone } from '../ui/IconContainer'
import { SectionHeader } from '../ui/SectionHeader'
import OverviewIcon, { type OverviewIconName } from './OverviewIcon'

interface QuickAction {
  label: string
  pathname: string
  icon: OverviewIconName
  tone: IconContainerTone
}

const actions: QuickAction[] = [
  { label: 'Add or update weight', pathname: '/health', icon: 'weight', tone: 'primary' },
  { label: 'Log food', pathname: '/nutrition', icon: 'nutrition', tone: 'nutrition' },
  { label: 'Add water', pathname: '/nutrition', icon: 'hydration', tone: 'hydration' },
  { label: 'Add activity', pathname: '/activity', icon: 'activity', tone: 'activity' },
  { label: 'Add sleep', pathname: '/activity', icon: 'sleep', tone: 'sleep' },
  { label: 'View goals', pathname: '/goals', icon: 'target', tone: 'primary' },
  { label: 'View progress', pathname: '/progress', icon: 'progress', tone: 'primary' },
]

export default function OverviewQuickActions() {
  const location = useLocation()

  return (
    <section aria-labelledby="overview-quick-actions-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-quick-actions-heading"
        title="Quick actions"
        description="Open tracking and progress for the selected profile."
      />
      <nav aria-label="Overview quick actions" className="grid min-w-0 grid-cols-2 gap-2.5">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            to={{ pathname: action.pathname, search: location.search }}
            className={classNames(
              index === actions.length - 1 && 'col-span-2',
              'group flex min-h-16 min-w-0 items-center gap-2.5 rounded-control border px-3 py-3 text-left text-sm font-semibold shadow-sm',
              'transition-[background-color,border-color,box-shadow,transform] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none',
              index === 0
                ? 'border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover'
                : 'border-app-border bg-app-surface text-app-primary hover:border-primary-100 hover:bg-primary-50',
            )}
          >
            <IconContainer aria-hidden="true" tone={action.tone} size="small">
              <OverviewIcon name={action.icon} />
            </IconContainer>
            <span className="min-w-0 flex-1 break-words">{action.label}</span>
            <OverviewIcon
              name="arrow"
              className={classNames(
                'h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none',
                index === 0 ? 'text-white/80' : 'text-app-muted',
              )}
            />
          </Link>
        ))}
      </nav>
    </section>
  )
}
