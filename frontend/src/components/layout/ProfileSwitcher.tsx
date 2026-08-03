import { useSelectedProfile } from '../../context/SelectedProfileContext'
import { classNames } from '../../utils/classNames'
import { LoadingState } from '../ui/LoadingState'

function activeProfileClasses(profileName: string): string {
  if (profileName === 'Husband') {
    return 'border-blue-200 bg-profile-husband-surface text-profile-husband ring-profile-husband/20'
  }
  if (profileName === 'Wife') {
    return 'border-pink-200 bg-profile-wife-surface text-profile-wife ring-profile-wife/20'
  }
  return 'border-primary-500 bg-primary-50 text-primary-700 ring-primary-500/20'
}

export default function ProfileSwitcher() {
  const {
    profiles,
    selectedProfileId,
    loading,
    selectProfile,
  } = useSelectedProfile()

  if (loading && profiles.length === 0) {
    return <LoadingState compact message="Loading profiles…" />
  }

  if (profiles.length === 0) {
    return <p className="text-sm text-app-secondary">No profiles available</p>
  }

  return (
    <div
      role="group"
      aria-label="Select active profile"
      className="grid grid-cols-2 gap-2"
    >
      {profiles.map((profile) => {
        const active = selectedProfileId === profile.id
        return (
          <button
            key={profile.id}
            type="button"
            aria-pressed={active}
            disabled={loading}
            onClick={() => selectProfile(profile.id)}
            className={classNames(
              'min-h-11 min-w-0 rounded-lg border px-3 py-2 text-sm font-semibold',
              'break-words transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-55',
              active
                ? classNames('ring-2', activeProfileClasses(profile.name))
                : 'border-app-border bg-app-surface text-app-secondary hover:bg-slate-50 hover:text-app-primary',
            )}
          >
            {profile.name}
            {active ? <span className="sr-only"> (active profile)</span> : null}
          </button>
        )
      })}
    </div>
  )
}
