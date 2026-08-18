import { useEffect, useState, type FormEvent } from 'react'
import type { UsePartnerLinkingResult } from '../hooks/usePartnerLinking'
import { formatLocalDateTime } from '../utils/dateFormatting'
import TrackingIcon from './TrackingIcon'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field } from './ui/Field'
import { IconContainer } from './ui/IconContainer'
import { LoadingState } from './ui/LoadingState'
import { SectionHeader } from './ui/SectionHeader'
import { StatusBadge } from './ui/StatusBadge'

interface PartnerLinkingPanelProps {
  state: UsePartnerLinkingResult
}

type CopyStatus = 'idle' | 'copied' | 'failed'

export default function PartnerLinkingPanel({ state }: PartnerLinkingPanelProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  useEffect(() => {
    setCopyStatus('idle')
  }, [state.rawInvitation?.inviteCode])

  async function createInvitation() {
    setCopyStatus('idle')
    try {
      await state.createInvitation()
      setInviteCode('')
    } catch {
      // The hook exposes the safe API error through the panel alert.
    }
  }

  async function revokeInvitation() {
    setCopyStatus('idle')
    try {
      await state.revokeInvitation()
      setInviteCode('')
    } catch {
      // The hook exposes the safe API error through the panel alert.
    }
  }

  async function copyInvitationCode() {
    const code = state.rawInvitation?.inviteCode
    if (!code || !navigator.clipboard?.writeText) {
      setCopyStatus('failed')
      return
    }
    try {
      await navigator.clipboard.writeText(code)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await state.previewInvitation(inviteCode)
    } catch {
      // The hook exposes the safe API error through the panel alert.
    }
  }

  async function acceptInvitation() {
    const submittedCode = inviteCode
    setInviteCode('')
    try {
      await state.acceptInvitation(submittedCode)
    } catch {
      setInviteCode(submittedCode)
      // The hook exposes the safe API error through the panel alert.
    }
  }

  const activeInvitation = state.activeInvitation?.active === true

  return (
    <Card
      as="section"
      padding="normal"
      elevated
      className="min-w-0 space-y-5 border-profile-shared/30 bg-profile-shared-surface/25"
      aria-labelledby="partner-linking-heading"
      aria-busy={state.loading || state.refreshing || state.mutating}
    >
      <SectionHeader
        headingId="partner-linking-heading"
        headingLevel={2}
        title={(
          <span className="flex min-w-0 items-center gap-3">
            <IconContainer aria-hidden="true" tone="shared" size="large">
              <TrackingIcon name="shared" />
            </IconContainer>
            <span className="break-words">Partner and household</span>
          </span>
        )}
        description={state.linked
          ? 'Your linked household can use shared Couple Challenges.'
          : 'Invite a partner or join the household of someone you trust.'}
        actions={state.linked ? <StatusBadge tone="profile-shared">Connected</StatusBadge> : null}
      />

      {state.loading ? <LoadingState message="Loading partner information..." /> : null}
      {state.refreshing ? <LoadingState compact message="Refreshing partner information..." /> : null}

      {state.loadError ? (
        <Alert
          tone="error"
          title={state.loadError.title}
          action={state.loadError.retryable ? (
            <Button variant="secondary" size="compact" onClick={state.reload}>
              Retry
            </Button>
          ) : null}
        >
          {state.loadError.message}
        </Alert>
      ) : null}

      {state.actionError ? (
        <Alert tone="error" title={state.actionError.title}>
          {state.actionError.message}
        </Alert>
      ) : null}
      {state.successMessage ? <Alert tone="success">{state.successMessage}</Alert> : null}

      {!state.loading && !state.loadError && state.linked && state.partner ? (
        <div className="flex min-w-0 flex-col gap-3 rounded-card border border-profile-shared/30 bg-app-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-label text-app-secondary">Linked partner</p>
            <p className="mt-1 break-words text-card-title text-app-primary">
              {state.partner.displayName}
            </p>
          </div>
          <StatusBadge tone="profile-shared">Shared household</StatusBadge>
        </div>
      ) : null}

      {!state.loading && !state.loadError && !state.linked ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Card as="section" padding="compact" className="min-w-0 space-y-4 bg-app-surface" aria-labelledby="invite-partner-heading">
            <div className="min-w-0">
              <h3 id="invite-partner-heading" className="text-card-title text-app-primary">Invite partner</h3>
              <p className="mt-1 break-words text-supporting text-app-secondary">
                Create a private code and share it directly with your partner.
              </p>
            </div>

            {activeInvitation ? (
              <div className="min-w-0 space-y-3 rounded-control border border-app-border-muted bg-app-background p-4">
                <StatusBadge tone="information">Active invitation</StatusBadge>
                <p className="break-words text-supporting text-app-secondary">
                  Expires <time dateTime={state.activeInvitation?.expiresAt ?? undefined}>{formatLocalDateTime(state.activeInvitation?.expiresAt)}</time>
                </p>
                {state.rawInvitation ? (
                  <div className="min-w-0 space-y-3">
                    <p className="text-metadata text-app-secondary">
                      This raw code is shown only when it is created.
                    </p>
                    <code className="block min-w-0 break-all rounded-control border border-app-border bg-app-surface px-3 py-3 text-sm font-semibold tracking-[0.08em] text-app-primary">
                      {state.rawInvitation.inviteCode}
                    </code>
                    <Button fullWidth variant="secondary" disabled={state.mutating} onClick={() => { void copyInvitationCode() }}>
                      Copy code
                    </Button>
                    <div className="min-h-5 text-metadata" role="status" aria-live="polite">
                      {copyStatus === 'copied' ? <span className="text-success">Invite code copied.</span> : null}
                      {copyStatus === 'failed' ? <span className="text-error">Copy failed. Select and copy the code manually.</span> : null}
                    </div>
                  </div>
                ) : (
                  <Alert tone="information" title="Code cannot be recovered">
                    For your privacy, the original raw code is not stored. Revoke it or create a replacement invitation.
                  </Alert>
                )}
              </div>
            ) : (
              <p className="break-words text-supporting text-app-secondary">
                No active invitation exists.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button disabled={state.mutating} onClick={() => { void createInvitation() }}>
                {activeInvitation ? 'Create replacement code' : 'Create invite code'}
              </Button>
              {activeInvitation ? (
                <Button variant="destructive" disabled={state.mutating} onClick={() => { void revokeInvitation() }}>
                  Revoke invitation
                </Button>
              ) : null}
            </div>
          </Card>

          <Card as="section" padding="compact" className="min-w-0 space-y-4 bg-app-surface" aria-labelledby="join-partner-heading">
            <div className="min-w-0">
              <h3 id="join-partner-heading" className="text-card-title text-app-primary">Join partner</h3>
              <p className="mt-1 break-words text-supporting text-app-secondary">
                Preview the invitation before choosing to connect.
              </p>
            </div>

            <form className="min-w-0 space-y-4" onSubmit={(event) => { void handlePreview(event) }}>
              <Field
                label="Invitation code"
                required
                hint="Separators and letter case are handled by the server."
              >
                {(controlProps) => (
                  <input
                    {...controlProps}
                    type="text"
                    value={inviteCode}
                    maxLength={64}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    disabled={state.mutating}
                    className="min-h-11 w-full min-w-0 border border-app-border bg-app-surface px-3 py-2.5 text-app-primary disabled:bg-app-border-muted"
                    onChange={(event) => {
                      setInviteCode(event.target.value)
                      state.clearPreview()
                    }}
                  />
                )}
              </Field>
              <Button type="submit" fullWidth disabled={state.mutating || inviteCode.trim().length === 0}>
                Preview invitation
              </Button>
            </form>

            {state.preview ? (
              <div className="min-w-0 space-y-4 rounded-card border border-profile-shared/30 bg-profile-shared-surface/45 p-4" role="group" aria-labelledby="partner-preview-heading">
                <div className="min-w-0">
                  <h4 id="partner-preview-heading" className="break-words text-card-title text-app-primary">
                    Connect with {state.preview.inviterDisplayName}?
                  </h4>
                  <p className="mt-2 break-words text-supporting text-app-secondary">
                    Invitation expires <time dateTime={state.preview.expiresAt}>{formatLocalDateTime(state.preview.expiresAt)}</time>.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button disabled={state.mutating} onClick={() => { void acceptInvitation() }}>
                    Connect
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={state.mutating}
                    onClick={() => {
                      state.clearPreview()
                      state.clearActionFeedback()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </Card>
  )
}
