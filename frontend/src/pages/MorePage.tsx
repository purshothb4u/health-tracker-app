import { Link, useLocation } from 'react-router'
import { preloadRoute } from '../app/routeModules'
import TrackingIcon, { type TrackingIconName } from '../components/TrackingIcon'
import { Card } from '../components/ui/Card'
import { IconContainer, type IconContainerTone } from '../components/ui/IconContainer'

interface MoreDestination {
  title: string
  description: string
  pathname: '/goals' | '/progress'
  hash?: string
  icon: TrackingIconName
  tone: IconContainerTone
}

const destinations: readonly MoreDestination[] = [
  {
    title: 'Goals',
    description: 'Manage personal goals, progress check-ins and shared challenges.',
    pathname: '/goals',
    icon: 'target',
    tone: 'primary',
  },
  {
    title: 'Progress',
    description: 'Explore selected-range weight and nutrition analytics.',
    pathname: '/progress',
    icon: 'trend',
    tone: 'nutrition',
  },
  {
    title: 'Partner and household',
    description: 'Invite a partner, join a household or review your connection.',
    pathname: '/goals',
    hash: '#partner-household',
    icon: 'shared',
    tone: 'shared',
  },
]

export default function MorePage() {
  const location = useLocation()

  return (
    <div className="min-w-0 space-y-rhythm-lg">
      <header className="min-w-0 border-b border-app-border-muted pb-6">
        <p className="text-label uppercase tracking-[0.14em] text-primary-700">More destinations</p>
        <h1 className="mt-2 break-words text-page-title text-app-primary">More</h1>
        <p className="mt-2 max-w-3xl break-words text-supporting text-app-secondary sm:text-base">
          Open goals, progress analytics, and partner or household settings.
        </p>
      </header>

      <nav aria-label="More destinations" className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {destinations.map((destination) => (
          <Link
            key={`${destination.pathname}${destination.hash ?? ''}`}
            to={{
              pathname: destination.pathname,
              search: location.search,
              hash: destination.hash,
            }}
            onFocus={() => preloadRoute(destination.pathname)}
            onPointerEnter={() => preloadRoute(destination.pathname)}
            onPointerDown={() => preloadRoute(destination.pathname)}
            className="group min-w-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app-background"
          >
            <Card
              padding="normal"
              elevated
              className="flex h-full min-w-0 items-start gap-4 transition-[border-color,box-shadow,transform] group-hover:-translate-y-0.5 group-hover:border-primary-100 group-hover:shadow-elevated motion-reduce:transform-none"
            >
              <IconContainer aria-hidden="true" tone={destination.tone} size="large">
                <TrackingIcon name={destination.icon} />
              </IconContainer>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-card-title text-app-primary">
                  {destination.title}
                </span>
                <span className="mt-1.5 block break-words text-supporting text-app-secondary">
                  {destination.description}
                </span>
                <span className="mt-4 inline-flex min-h-11 items-center text-label text-primary-700">
                  Open <span aria-hidden="true" className="ml-1">→</span>
                </span>
              </span>
            </Card>
          </Link>
        ))}
      </nav>
    </div>
  )
}
