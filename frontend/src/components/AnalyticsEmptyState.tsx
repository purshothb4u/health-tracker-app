interface AnalyticsEmptyStateProps {
  title: string
  description: string
}

export default function AnalyticsEmptyState({ title, description }: AnalyticsEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  )
}
