import type { ComponentType } from 'react'

type PageModule = { default: ComponentType }

type LazyRoutePath = '/health' | '/nutrition' | '/activity' | '/goals' | '/progress' | '/more'

export const loadHealthPage = () => import('../pages/HealthPage')
export const loadNutritionPage = () => import('../pages/NutritionPage')
export const loadActivityPage = () => import('../pages/ActivityPage')
export const loadGoalsPage = () => import('../pages/GoalsPage')
export const loadProgressPage = () => import('../pages/ProgressPage')
export const loadMorePage = () => import('../pages/MorePage')

const routeLoaders: Record<LazyRoutePath, () => Promise<PageModule>> = {
  '/health': loadHealthPage,
  '/nutrition': loadNutritionPage,
  '/activity': loadActivityPage,
  '/goals': loadGoalsPage,
  '/progress': loadProgressPage,
  '/more': loadMorePage,
}

const idlePreloadPaths: readonly Exclude<LazyRoutePath, '/progress'>[] = [
  '/health',
  '/nutrition',
  '/activity',
  '/goals',
  '/more',
]

function lazyRoutePath(pathname: string): LazyRoutePath | null {
  const normalizedPath = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname
  return normalizedPath in routeLoaders ? normalizedPath as LazyRoutePath : null
}

export function preloadRoute(pathname: string): void {
  const path = lazyRoutePath(pathname)
  if (path !== null) {
    void routeLoaders[path]()
  }
}

export function scheduleIdleRoutePreloads(): () => void {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean }
  }).connection
  if (connection?.saveData) {
    return () => undefined
  }

  const preload = () => {
    idlePreloadPaths.forEach((path) => preloadRoute(path))
  }

  const idleWindow = window as unknown as {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    cancelIdleCallback?: (handle: number) => void
  }
  if (idleWindow.requestIdleCallback) {
    const idleCallbackId = idleWindow.requestIdleCallback(preload, { timeout: 4_000 })
    return () => idleWindow.cancelIdleCallback?.(idleCallbackId)
  }

  const timeoutId = globalThis.setTimeout(preload, 1_500)
  return () => globalThis.clearTimeout(timeoutId)
}
