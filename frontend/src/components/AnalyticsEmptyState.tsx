import { EmptyState } from './ui/EmptyState'

interface AnalyticsEmptyStateProps {
  title: string
  description: string
}

export default function AnalyticsEmptyState({ title, description }: AnalyticsEmptyStateProps) {
  return <EmptyState title={title} description={description} />
}
