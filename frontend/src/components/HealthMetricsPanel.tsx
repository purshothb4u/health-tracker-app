import HealthMetricForm from './HealthMetricForm'
import HealthMetricHistory from './HealthMetricHistory'
import HealthSummaryCard from './HealthSummaryCard'
import { useHealthMetrics } from '../hooks/useHealthMetrics'
import type { UserProfile } from '../types/UserProfile'

interface HealthMetricsPanelProps {
  profile: UserProfile
  onMetricSaved: () => void
}

export default function HealthMetricsPanel({ profile, onMetricSaved }: HealthMetricsPanelProps) {
  const { metrics, summary, loading, error, reload } = useHealthMetrics(profile.id)

  function handleMetricSaved() {
    reload()
    onMetricSaved()
  }

  return (
    <section className="space-y-4">
      <div className="px-1">
        <h3 className="text-lg font-semibold text-gray-900">{profile.name}&apos;s health metrics</h3>
        <p className="mt-1 text-sm text-gray-500">Record today&apos;s weight and review your progress.</p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600 shadow-sm">
          Loading health metrics...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {summary && <HealthSummaryCard summary={summary} />}
          <HealthMetricForm userProfileId={profile.id} metrics={metrics} onSaved={handleMetricSaved} />
          <HealthMetricHistory metrics={metrics} />
        </>
      )}
    </section>
  )
}
