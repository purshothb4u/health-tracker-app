import { useEffect } from 'react'
import { useLocation } from 'react-router'
import CoupleChallengesPanel from '../components/CoupleChallengesPanel'
import GoalsPanel from '../components/GoalsPanel'
import PartnerLinkingPanel from '../components/PartnerLinkingPanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { useSelectedProfile } from '../context/SelectedProfileContext'
import { usePartnerLinking } from '../hooks/usePartnerLinking'
import { classNames } from '../utils/classNames'

export default function GoalsPage() {
  const location = useLocation()
  const partnerLinking = usePartnerLinking()
  const {
    profiles,
    selectedProfile,
    loading,
    error,
    reloadProfiles,
  } = useSelectedProfile()

  useEffect(() => {
    if (location.hash !== '#partner-household' || selectedProfile === null) {
      return
    }

    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById('partner-household')?.scrollIntoView({ block: 'start' })
    })
    return () => window.cancelAnimationFrame(animationFrame)
  }, [location.hash, selectedProfile])

  return (
    <div className="min-w-0 space-y-rhythm-lg">
      <header className="flex min-w-0 flex-col gap-4 border-b border-app-border-muted pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-label uppercase tracking-[0.14em] text-primary-700">Personal and shared</p>
          <h1 className="mt-2 break-words text-page-title text-app-primary">Goals</h1>
          <p className="mt-2 max-w-3xl break-words text-supporting text-app-secondary sm:text-base">
            Build personal momentum and support one another through shared challenges.
          </p>
        </div>
      </header>

      {loading && selectedProfile === null ? (
        <LoadingState message="Loading goals and profiles..." />
      ) : null}

      {!loading && error ? (
        <Alert
          tone="error"
          title="Unable to load the selected profile"
          action={(
            <Button variant="secondary" size="compact" onClick={reloadProfiles}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      ) : null}

      {!loading && !error && profiles.length === 0 ? (
        <EmptyState
          title="No user profiles yet"
          description="Create profiles through the existing user API or restart with development seed data enabled."
        />
      ) : null}

      {!error && selectedProfile ? (
        <>
          <PartnerLinkingPanel state={partnerLinking} />
          <div className={classNames(
            'grid min-w-0 gap-8 xl:items-start',
            partnerLinking.linked
              ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]'
              : 'xl:grid-cols-1',
          )}>
            <GoalsPanel
              key={selectedProfile.id}
              profileName={selectedProfile.displayName}
              userProfileId={selectedProfile.id}
            />
            {partnerLinking.linked ? (
              <CoupleChallengesPanel
                eligibleParticipants={partnerLinking.eligibleParticipants}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
