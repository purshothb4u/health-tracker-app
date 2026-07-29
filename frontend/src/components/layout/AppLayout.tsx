import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-50">
      <header className="border-b border-primary-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
              HealthAITracker
            </p>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          </div>
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
            v0.0.1
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
