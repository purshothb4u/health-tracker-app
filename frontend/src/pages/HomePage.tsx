import HealthMetricsPanel from '../components/HealthMetricsPanel'
import FoodTrackingPanel from '../components/FoodTrackingPanel'
import WaterTrackingPanel from '../components/WaterTrackingPanel'
import AnalyticsPanel from '../components/AnalyticsPanel'
import UserProfileCard from '../components/UserProfileCard'
import { useUserProfiles } from '../hooks/useUserProfiles'

export default function HomePage() {
  const { profiles, loading, error, reload } = useUserProfiles()

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track weight-loss progress for both users
        </p>
      </section>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-6 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading user profiles...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <p className="mt-1 text-xs text-red-600">
            Ensure the backend is running with{' '}
            <code className="font-mono">.\mvnw.cmd spring-boot:run</code>
          </p>
        </div>
      )}

      {!loading && !error && profiles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">No user profiles yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Create profiles via POST /api/users or restart with seed data enabled.
          </p>
        </div>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="grid min-w-0 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="min-w-0 space-y-4">
              <div className="w-full min-w-0 max-w-lg space-y-4">
                <UserProfileCard profile={profile} />
                <HealthMetricsPanel profile={profile} onMetricSaved={reload} />
                <FoodTrackingPanel profile={profile} />
                <WaterTrackingPanel profileName={profile.name} userProfileId={profile.id} />
              </div>
              <AnalyticsPanel profileName={profile.name} userProfileId={profile.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
