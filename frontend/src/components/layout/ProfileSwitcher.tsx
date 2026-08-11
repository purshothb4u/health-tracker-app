import { useSelectedProfile } from '../../context/SelectedProfileContext'
import { classNames } from '../../utils/classNames'
import { LoadingState } from '../ui/LoadingState'

interface ProfileSwitcherProps {
  compact?: boolean
}

interface ProfilePresentation {
  initial: string
  activeButton: string
  inactiveButton: string
  activeInitial: string
  inactiveInitial: string
  check: string
}

function profilePresentation(profileName: string): ProfilePresentation {
  if (profileName === 'Husband') {
    return {
      initial: 'H',
      activeButton: 'border-profile-husband-accent bg-profile-husband-accent text-white shadow-sm',
      inactiveButton: 'border-transparent bg-transparent text-profile-husband hover:bg-profile-husband-surface',
      activeInitial: 'bg-white/20 text-white',
      inactiveInitial: 'bg-profile-husband-surface text-profile-husband',
      check: 'text-profile-husband',
    }
  }

  if (profileName === 'Wife') {
    return {
      initial: 'W',
      activeButton: 'border-profile-wife-accent bg-profile-wife-accent text-white shadow-sm',
      inactiveButton: 'border-transparent bg-transparent text-profile-wife hover:bg-profile-wife-surface',
      activeInitial: 'bg-white/20 text-white',
      inactiveInitial: 'bg-profile-wife-surface text-profile-wife',
      check: 'text-profile-wife',
    }
  }

  return {
    initial: profileName.trim().charAt(0).toUpperCase() || 'P',
    activeButton: 'border-primary bg-primary text-white shadow-sm',
    inactiveButton: 'border-transparent bg-transparent text-primary-700 hover:bg-primary-50',
    activeInitial: 'bg-white/20 text-white',
    inactiveInitial: 'bg-primary-50 text-primary-700',
    check: 'text-primary-700',
  }
}

function ActiveCheck({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={classNames(
        'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-app-surface shadow-sm ring-1 ring-app-border-muted',
        className,
      )}
    >
      <svg
        className="h-2.5 w-2.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        viewBox="0 0 16 16"
      >
        <path d="m3.5 8.2 2.7 2.7 6.3-6.3" />
      </svg>
    </span>
  )
}

export default function ProfileSwitcher({ compact = false }: ProfileSwitcherProps) {
  const {
    profiles,
    selectedProfileId,
    loading,
    selectProfile,
  } = useSelectedProfile()

  if (loading && profiles.length === 0) {
    return (
      <div className={compact ? 'w-[6.5rem]' : 'w-full'}>
        <LoadingState compact message={compact ? 'Loading…' : 'Loading profiles…'} />
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <p className={classNames('text-metadata text-app-secondary', compact && 'max-w-24 text-right')}>
        No profiles available
      </p>
    )
  }

  return (
    <div
      role="group"
      aria-label="Select active profile"
      className={classNames(
        'grid grid-cols-2 gap-1 rounded-full border border-app-border bg-app-surface-elevated p-1 shadow-sm',
        compact ? 'shrink-0' : 'w-full',
      )}
    >
      {profiles.map((profile) => {
        const active = selectedProfileId === profile.id
        const presentation = profilePresentation(profile.name)

        return (
          <button
            key={profile.id}
            type="button"
            aria-pressed={active}
            disabled={loading}
            onClick={() => selectProfile(profile.id)}
            className={classNames(
              'relative flex min-h-11 min-w-0 items-center justify-center rounded-full border font-semibold',
              'transition-[background-color,border-color,color,box-shadow] duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface',
              'disabled:cursor-not-allowed disabled:opacity-55',
              compact ? 'w-11 px-1' : 'gap-2 px-2 py-1.5 text-sm',
              active ? presentation.activeButton : presentation.inactiveButton,
            )}
          >
            <span
              aria-hidden="true"
              className={classNames(
                'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                active ? presentation.activeInitial : presentation.inactiveInitial,
              )}
            >
              {presentation.initial}
              {active ? <ActiveCheck className={presentation.check} /> : null}
            </span>
            {compact ? <span className="sr-only">{profile.name}</span> : (
              <span className="min-w-0 truncate">{profile.name}</span>
            )}
            {active ? <span className="sr-only"> (active profile)</span> : null}
          </button>
        )
      })}
    </div>
  )
}
