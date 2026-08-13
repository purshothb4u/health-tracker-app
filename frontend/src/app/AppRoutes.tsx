import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import AppLayout from '../components/layout/AppLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/LoadingState'
import { useAuth } from '../context/AuthContext'
import { SelectedProfileProvider } from '../context/SelectedProfileContext'
import LoginPage from '../pages/LoginPage'
import OnboardingPage from '../pages/OnboardingPage'
import OverviewPage from '../pages/OverviewPage'
import SignUpPage from '../pages/SignUpPage'

const HealthPage = lazy(() => import('../pages/HealthPage'))
const NutritionPage = lazy(() => import('../pages/NutritionPage'))
const ActivityPage = lazy(() => import('../pages/ActivityPage'))
const GoalsPage = lazy(() => import('../pages/GoalsPage'))
const ProgressPage = lazy(() => import('../pages/ProgressPage'))

interface RedirectLocationState {
  from?: {
    pathname?: string
    search?: string
    hash?: string
  }
}

function intendedDestination(state: unknown): string {
  const redirectState = state as RedirectLocationState | null
  const pathname = redirectState?.from?.pathname
  if (!pathname?.startsWith('/') || pathname === '/login' || pathname === '/signup') {
    return '/'
  }

  return `${pathname}${redirectState?.from?.search ?? ''}${redirectState?.from?.hash ?? ''}`
}

function SignUpRoute() {
  const { authenticated, identity, restoring, restoreError } = useAuth()
  if (restoring) return <SessionStatus />
  if (restoreError) return <SessionStatus error={restoreError} />
  if (authenticated) {
    return <Navigate replace to={identity?.profileComplete ? '/' : '/onboarding'} />
  }
  return <SignUpPage />
}

function InvalidRouteRedirect() {
  const location = useLocation()
  return <Navigate replace to={{ pathname: '/', search: location.search }} />
}

function SessionStatus({ error }: { error?: string }) {
  const { retryRestore } = useAuth()
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-background px-4 py-8">
      <div className="w-full max-w-lg">
        {error ? (
          <Alert
            tone="error"
            title="Unable to confirm your session"
            action={<Button variant="secondary" onClick={retryRestore}>Retry</Button>}
          >
            {error}
          </Alert>
        ) : (
          <LoadingState message="Restoring your session…" />
        )}
      </div>
    </main>
  )
}

function LoginRoute() {
  const { authenticated, identity, restoring, restoreError } = useAuth()
  const location = useLocation()
  const destination = intendedDestination(location.state)
  if (restoring) return <SessionStatus />
  if (restoreError) return <SessionStatus error={restoreError} />
  if (authenticated) {
    return <Navigate replace to={identity?.profileComplete ? destination : '/onboarding'} />
  }
  return <LoginPage destination={destination} />
}

function OnboardingRoute() {
  const { authenticated, restoring, restoreError } = useAuth()
  const location = useLocation()
  if (restoring) return <SessionStatus />
  if (restoreError) return <SessionStatus error={restoreError} />
  if (!authenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }
  return <OnboardingPage />
}

function RequireCompletedProfile() {
  const { authenticated, identity, restoring, restoreError } = useAuth()
  const location = useLocation()
  if (restoring) return <SessionStatus />
  if (restoreError) return <SessionStatus error={restoreError} />
  if (!authenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }
  if (!identity?.profileComplete) {
    return <Navigate replace to="/onboarding" />
  }
  return <SelectedProfileProvider><AppLayout /></SelectedProfileProvider>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginRoute />} />
      <Route path="signup" element={<SignUpRoute />} />
      <Route path="onboarding" element={<OnboardingRoute />} />
      <Route element={<RequireCompletedProfile />}>
        <Route index element={<OverviewPage />} />
        <Route
          path="health"
          element={(
            <Suspense fallback={<LoadingState message="Loading Health page..." />}>
              <HealthPage />
            </Suspense>
          )}
        />
        <Route
          path="nutrition"
          element={(
            <Suspense fallback={<LoadingState message="Loading Nutrition page..." />}>
              <NutritionPage />
            </Suspense>
          )}
        />
        <Route
          path="activity"
          element={(
            <Suspense fallback={<LoadingState message="Loading Activity page..." />}>
              <ActivityPage />
            </Suspense>
          )}
        />
        <Route
          path="goals"
          element={(
            <Suspense fallback={<LoadingState message="Loading Goals page..." />}>
              <GoalsPage />
            </Suspense>
          )}
        />
        <Route
          path="progress"
          element={(
            <Suspense fallback={<LoadingState message="Loading Progress page..." />}>
              <ProgressPage />
            </Suspense>
          )}
        />
        <Route path="*" element={<InvalidRouteRedirect />} />
      </Route>
    </Routes>
  )
}
