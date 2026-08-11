import TrackingIcon, { type TrackingIconName } from './TrackingIcon'
import { EmptyState } from './ui/EmptyState'
import type { IconContainerTone } from './ui/IconContainer'

interface AnalyticsEmptyStateProps {
  title: string
  description: string
  iconName?: TrackingIconName
  iconTone?: IconContainerTone
}

export default function AnalyticsEmptyState({
  title,
  description,
  iconName = 'history',
  iconTone = 'primary',
}: AnalyticsEmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<TrackingIcon name={iconName} />}
      iconTone={iconTone}
    />
  )
}
