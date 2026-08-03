import { Link, useLocation } from 'react-router'
import { SectionHeader } from '../ui/SectionHeader'

const actions = [
  { label: 'Add or update weight', pathname: '/health' },
  { label: 'Log food', pathname: '/nutrition' },
  { label: 'Add water', pathname: '/nutrition' },
  { label: 'Add activity', pathname: '/activity' },
  { label: 'Add sleep', pathname: '/activity' },
  { label: 'View goals', pathname: '/goals' },
  { label: 'View progress', pathname: '/progress' },
]

export default function OverviewQuickActions() {
  const location = useLocation()

  return (
    <section aria-labelledby="overview-quick-actions-heading" className="min-w-0 space-y-4">
      <SectionHeader
        headingId="overview-quick-actions-heading"
        title="Quick actions"
        description="Open the full tracking page for the selected profile."
      />
      <nav aria-label="Overview quick actions" className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={{ pathname: action.pathname, search: location.search }}
            className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl border border-app-border bg-app-surface px-4 py-3 text-center text-sm font-semibold text-app-primary shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            {action.label}
          </Link>
        ))}
      </nav>
    </section>
  )
}
