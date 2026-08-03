import { NavLink, useLocation } from 'react-router'
import { classNames } from '../../utils/classNames'

interface NavigationItem {
  label: string
  to: string
  end?: boolean
}

interface PrimaryNavigationProps {
  layout: 'desktop' | 'mobile'
}

const navigationItems: NavigationItem[] = [
  { label: 'Overview', to: '/', end: true },
  { label: 'Health', to: '/health' },
  { label: 'Nutrition', to: '/nutrition' },
  { label: 'Activity', to: '/activity' },
  { label: 'Goals', to: '/goals' },
  { label: 'Progress', to: '/progress' },
]

export default function PrimaryNavigation({ layout }: PrimaryNavigationProps) {
  const mobile = layout === 'mobile'
  const location = useLocation()

  return (
    <nav
      aria-label={mobile ? 'Mobile primary navigation' : 'Primary navigation'}
      className={classNames(mobile && 'overflow-x-auto overscroll-x-contain')}
    >
      <div className={classNames(mobile ? 'inline-flex min-w-max gap-1 px-4' : 'space-y-1')}>
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={{ pathname: item.to, search: location.search }}
            end={item.end}
            className={({ isActive }) => classNames(
              'flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              isActive
                ? 'bg-primary-100 text-primary-700'
                : 'text-app-secondary hover:bg-slate-100 hover:text-app-primary',
              mobile && 'shrink-0',
            )}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
