import { useEffect, useId, useRef, useState, type FocusEvent } from 'react'
import { matchPath, NavLink, useLocation } from 'react-router'
import { classNames } from '../../utils/classNames'

type NavigationIconName =
  | 'overview'
  | 'health'
  | 'nutrition'
  | 'activity'
  | 'goals'
  | 'progress'
  | 'more'

interface NavigationItem {
  label: string
  to: string
  icon: NavigationIconName
  mobilePlacement: 'primary' | 'more'
  end?: boolean
}

interface PrimaryNavigationProps {
  layout: 'desktop' | 'mobile'
}

const navigationItems: readonly NavigationItem[] = [
  { label: 'Overview', to: '/', icon: 'overview', mobilePlacement: 'primary', end: true },
  { label: 'Health', to: '/health', icon: 'health', mobilePlacement: 'primary' },
  { label: 'Nutrition', to: '/nutrition', icon: 'nutrition', mobilePlacement: 'primary' },
  { label: 'Activity', to: '/activity', icon: 'activity', mobilePlacement: 'primary' },
  { label: 'Goals', to: '/goals', icon: 'goals', mobilePlacement: 'more' },
  { label: 'Progress', to: '/progress', icon: 'progress', mobilePlacement: 'more' },
]

const mobilePrimaryItems = navigationItems.filter((item) => item.mobilePlacement === 'primary')
const mobileMoreItems = navigationItems.filter((item) => item.mobilePlacement === 'more')

function NavigationIcon({ name, className = 'h-5 w-5' }: {
  name: NavigationIconName
  className?: string
}) {
  const path = {
    overview: <path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 6.9l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z" />,
    health: (
      <>
        <rect height="15" rx="3" width="16" x="4" y="5" />
        <path d="M8 10a4 4 0 0 1 8 0" />
        <path d="m12 10 2-2" />
      </>
    ),
    nutrition: (
      <>
        <path d="M7 3v8" />
        <path d="M4.5 3v4.5A3 3 0 0 0 7 10.4a3 3 0 0 0 2.5-2.9V3" />
        <path d="M7 11v10" />
        <path d="M16 3v18" />
        <path d="M16 3c2.2 2 3 4 3 7h-3" />
      </>
    ),
    activity: (
      <>
        <path d="M4 13h3l2-6 4 11 2-5h5" />
        <path d="M5 5h2" />
      </>
    ),
    goals: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M15 9 21 3" />
      </>
    ),
    progress: (
      <>
        <path d="M5 20V10" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
        <path d="M3 20h18" />
      </>
    ),
    more: (
      <>
        <path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8L12 3Z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
      </>
    ),
  }[name]

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {path}
    </svg>
  )
}

function mobileItemClasses(active: boolean): string {
  return classNames(
    'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-control px-1 py-1.5',
    'text-xs font-semibold leading-4 transition-colors duration-150 motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus',
    active
      ? 'bg-primary-50 text-primary-700'
      : 'text-app-muted hover:bg-app-border-muted/60 hover:text-app-primary',
  )
}

export default function PrimaryNavigation({ layout }: PrimaryNavigationProps) {
  const mobile = layout === 'mobile'
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreMenuId = useId()
  const moreRootRef = useRef<HTMLDivElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const moreActive = mobileMoreItems.some((item) => (
    matchPath({ path: item.to, end: true }, location.pathname) !== null
  ))

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!mobile) {
      return
    }

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    function handleBreakpointChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMoreOpen(false)
      }
    }

    desktopQuery.addEventListener('change', handleBreakpointChange)
    return () => desktopQuery.removeEventListener('change', handleBreakpointChange)
  }, [mobile])

  useEffect(() => {
    if (!mobile || !moreOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && !moreRootRef.current?.contains(target)) {
        setMoreOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      setMoreOpen(false)
      moreButtonRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobile, moreOpen])

  function handleMoreBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return
    }
    setMoreOpen(false)
  }

  if (!mobile) {
    return (
      <nav aria-label="Primary navigation">
        <div className="space-y-1.5">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={{ pathname: item.to, search: location.search }}
              end={item.end}
              className={({ isActive }) => classNames(
                'group flex min-h-11 items-center gap-3 rounded-control px-2.5 py-2 text-label',
                'transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-inset ring-primary-100'
                  : 'text-app-secondary hover:bg-app-border-muted/60 hover:text-app-primary',
              )}
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={classNames(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-control transition-colors duration-150 motion-reduce:transition-none',
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-app-border-muted text-app-secondary group-hover:bg-primary-50 group-hover:text-primary-700',
                    )}
                  >
                    <NavigationIcon className="h-[18px] w-[18px]" name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    )
  }

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-app-border-muted bg-app-surface/95 shadow-[0_-10px_30px_-24px_rgb(34_49_41_/_0.45)] backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto grid w-full max-w-xl grid-cols-5 gap-1 px-2 pt-2">
        {mobilePrimaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={{ pathname: item.to, search: location.search }}
            end={item.end}
            className={({ isActive }) => mobileItemClasses(isActive)}
          >
            <NavigationIcon name={item.icon} />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}

        <div ref={moreRootRef} className="relative min-w-0" onBlur={handleMoreBlur}>
          <button
            ref={moreButtonRef}
            type="button"
            aria-controls={moreMenuId}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((current) => !current)}
            className={classNames(mobileItemClasses(moreActive), 'w-full')}
          >
            <NavigationIcon name="more" />
            <span className="truncate">More</span>
            {moreActive ? <span className="sr-only">, current section</span> : null}
          </button>

          {moreOpen ? (
            <div
              id={moreMenuId}
              role="group"
              aria-label="More destinations"
              className="absolute bottom-[calc(100%+0.625rem)] right-0 w-48 max-w-[calc(100vw-1rem)] rounded-card border border-app-border-muted bg-app-surface-elevated p-2 shadow-elevated"
            >
              <p className="px-2 pb-1.5 pt-1 text-metadata font-semibold uppercase tracking-[0.12em] text-app-muted">
                More destinations
              </p>
              <div className="space-y-1">
                {mobileMoreItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={{ pathname: item.to, search: location.search }}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) => classNames(
                      'flex min-h-11 items-center gap-2.5 rounded-control px-2.5 py-2 text-label',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-app-secondary hover:bg-app-border-muted/60 hover:text-app-primary',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-border-muted"
                    >
                      <NavigationIcon className="h-4 w-4" name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
