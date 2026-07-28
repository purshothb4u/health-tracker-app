import type { UserProfile } from '../types/UserProfile'

interface UserProfileCardProps {
  profile: UserProfile
}

export default function UserProfileCard({ profile }: UserProfileCardProps) {
  const progressWidth = `${Math.min(100, Math.max(0, profile.goalProgressPercent))}%`

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
          <p className="text-sm text-gray-500">
            {profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()} · {profile.age} yrs
          </p>
        </div>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
          {profile.goalProgressPercent.toFixed(1)}% goal
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Current
          </dt>
          <dd className="mt-1 text-xl font-bold text-gray-900">
            {profile.currentWeightKg} <span className="text-sm font-normal text-gray-500">kg</span>
          </dd>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Target
          </dt>
          <dd className="mt-1 text-xl font-bold text-primary-700">
            {profile.targetWeightKg} <span className="text-sm font-normal text-gray-500">kg</span>
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">Goal progress</span>
          <span className="font-medium text-gray-900">{profile.goalProgressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-gray-100 px-3 py-2">
          <p className="text-gray-500">Lost so far</p>
          <p className="font-semibold text-gray-900">{profile.weightLostKg} kg</p>
        </div>
        <div className="rounded-lg border border-gray-100 px-3 py-2">
          <p className="text-gray-500">Remaining</p>
          <p className="font-semibold text-gray-900">{profile.weightRemainingKg} kg</p>
        </div>
      </div>
    </article>
  )
}
