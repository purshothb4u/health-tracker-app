import { Outlet } from 'react-router'
import PrimaryNavigation from './PrimaryNavigation'
import ProfileSwitcher from './ProfileSwitcher'

function BrandHeartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 6.9l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z" />
    </svg>
  )
}

function ApplicationIdentity({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-control bg-primary text-white shadow-[0_8px_22px_rgb(62_119_89_/_0.2)] ${compact ? 'h-9 w-9' : 'h-10 w-10'}`}
      >
        <BrandHeartIcon />
      </span>
      <div className="min-w-0">
        <p className="truncate text-card-title tracking-[-0.025em] text-app-primary">
          HealthAITracker
        </p>
        <p
          className={`mt-0.5 truncate text-metadata text-app-muted ${compact ? 'hidden min-[390px]:block' : ''}`}
        >
          Personal health, shared support
        </p>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <div className="min-h-screen overflow-x-clip bg-app-background lg:flex">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[70] -translate-y-24 rounded-control bg-primary px-4 py-2.5 text-label text-white shadow-elevated transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 motion-reduce:transition-none"
      >
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-app-border-muted bg-app-surface/95 px-5 py-6 shadow-[8px_0_32px_-30px_rgb(34_49_41_/_0.45)] lg:flex">
        <div className="px-1">
          <ApplicationIdentity />
        </div>

        <div className="mt-8">
          <p className="mb-3 px-3 text-metadata font-semibold uppercase tracking-[0.14em] text-app-muted">
            Navigate
          </p>
          <PrimaryNavigation layout="desktop" />
        </div>

        <div className="mt-auto rounded-card border border-app-border-muted bg-app-background/70 p-3">
          <p className="mb-2.5 text-metadata font-semibold uppercase tracking-[0.14em] text-app-muted">
            Active profile
          </p>
          <ProfileSwitcher />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header
          className="sticky top-0 z-40 border-b border-app-border-muted bg-app-surface/95 shadow-card backdrop-blur-sm lg:hidden"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex min-h-16 items-center justify-between gap-2.5 px-3 py-2.5 min-[390px]:px-4 sm:px-6">
            <ApplicationIdentity compact />
            <ProfileSwitcher compact />
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="min-w-0 focus:outline-none">
          <div className="mx-auto w-full max-w-[90rem] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8">
            <Outlet />
          </div>
        </main>

        <PrimaryNavigation layout="mobile" />
      </div>
    </div>
  )
}
