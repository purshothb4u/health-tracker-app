import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import AppLayout from '../components/layout/AppLayout'
import { LoadingState } from '../components/ui/LoadingState'
import OverviewPage from '../pages/OverviewPage'

const HealthPage = lazy(() => import('../pages/HealthPage'))
const NutritionPage = lazy(() => import('../pages/NutritionPage'))
const ActivityPage = lazy(() => import('../pages/ActivityPage'))
const GoalsPage = lazy(() => import('../pages/GoalsPage'))
const ProgressPage = lazy(() => import('../pages/ProgressPage'))

function InvalidRouteRedirect() {
  const location = useLocation()
  return <Navigate replace to={{ pathname: '/', search: location.search }} />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
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
