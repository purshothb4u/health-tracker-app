export type TrackingIconName =
  | 'weight'
  | 'nutrition'
  | 'hydration'
  | 'activity'
  | 'sleep'
  | 'history'
  | 'target'
  | 'shared'
  | 'achievement'
  | 'check'
  | 'plus'
  | 'calendar'
  | 'trend'

interface TrackingIconProps {
  name: TrackingIconName
  className?: string
}

export default function TrackingIcon({ name, className = 'h-5 w-5' }: TrackingIconProps) {
  const path = {
    weight: (
      <>
        <rect height="15" rx="3" width="16" x="4" y="5" />
        <path d="M8 10a4 4 0 0 1 8 0" />
        <path d="m12 10 2-2" />
      </>
    ),
    nutrition: (
      <>
        <path d="M7 3v8" />
        <path d="M4.5 3v4.5A3 3 0 0 0 7 10.4a3 3 0 0 0 2.5-2.9V3" />
        <path d="M7 11v10" />
        <path d="M16 3v18" />
        <path d="M16 3c2.2 2 3 4 3 7h-3" />
      </>
    ),
    hydration: <path d="M12 3S6.5 9.2 6.5 13.4a5.5 5.5 0 0 0 11 0C17.5 9.2 12 3 12 3Z" />,
    activity: (
      <>
        <path d="M4 13h3l2-6 4 11 2-5h5" />
        <path d="M5 5h2" />
      </>
    ),
    sleep: <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5a8.5 8.5 0 1 0 10.6 10.6Z" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M15 9 21 3" />
      </>
    ),
    shared: <path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 6.9l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z" />,
    achievement: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H5v2a4 4 0 0 0 4 4" />
        <path d="M16 6h3v2a4 4 0 0 1-4 4" />
        <path d="M12 13v4" />
        <path d="M8 21h8" />
        <path d="M9 17h6v4H9z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    calendar: (
      <>
        <rect height="16" rx="3" width="18" x="3" y="5" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M3 10h18" />
      </>
    ),
    trend: (
      <>
        <path d="M4 18V6" />
        <path d="M4 18h16" />
        <path d="m7 14 4-4 3 2 5-6" />
      </>
    ),
  }[name]

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {path}
    </svg>
  )
}
