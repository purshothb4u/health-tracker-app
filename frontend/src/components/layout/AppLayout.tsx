import { Outlet } from 'react-router'
import PrimaryNavigation from './PrimaryNavigation'
import ProfileSwitcher from './ProfileSwitcher'

function ApplicationIdentity() {
  return (
    <div className="min-w-0">
      <p className="text-sm font-bold tracking-tight text-app-primary">HealthAITracker</p>
      <p className="mt-0.5 text-xs leading-5 text-app-secondary">Personal health dashboard</p>
    </div>
  )
}

export default function AppLayout() {
  return (
    <div className="min-h-screen overflow-x-clip bg-app-background lg:flex">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-lg bg-app-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 motion-reduce:transition-none"
      >
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-app-border bg-app-surface px-4 py-5 lg:flex">
        <div className="flex items-start justify-between gap-3 px-2">
          <ApplicationIdentity />
          <span className="shrink-0 rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700">
            v0.0.1
          </span>
        </div>
        <div className="mt-7">
          <PrimaryNavigation layout="desktop" />
        </div>
        <div className="mt-auto border-t border-app-border pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-secondary">
            Active profile
          </p>
          <ProfileSwitcher />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-app-border bg-app-surface/95 shadow-sm backdrop-blur-sm lg:hidden">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <ApplicationIdentity />
            <span className="shrink-0 rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700">
              v0.0.1
            </span>
          </div>
          <div className="px-4 pb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-secondary">
              Active profile
            </p>
            <ProfileSwitcher />
          </div>
          <div className="border-t border-app-border py-1">
            <PrimaryNavigation layout="mobile" />
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="min-w-0 focus:outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
