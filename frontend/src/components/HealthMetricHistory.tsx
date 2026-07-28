import type { HealthMetric } from '../types/HealthMetric'

interface HealthMetricHistoryProps {
  metrics: HealthMetric[]
}

function formatMetricDate(metricDate: string): string {
  return new Date(`${metricDate}T00:00:00`).toLocaleDateString()
}

export default function HealthMetricHistory({ metrics }: HealthMetricHistoryProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="text-base font-semibold text-gray-900">Weight history</h4>

      {metrics.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No weight records yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Weight</th>
                <th className="px-2 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-2 py-3 text-gray-700">{formatMetricDate(metric.metricDate)}</td>
                  <td className="px-2 py-3 font-medium text-gray-900">{metric.weightKg} kg</td>
                  <td className="px-2 py-3 text-gray-500">{metric.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
