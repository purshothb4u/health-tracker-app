import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  description: ReactNode
  confirmLabel?: string
  confirmingLabel?: string
  cancelLabel?: string
  confirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting...',
  cancelLabel = 'Cancel',
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const confirmationStartedRef = useRef(false)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      confirmationStartedRef.current = false
      dialog.showModal()
      cancelButtonRef.current?.focus()
    }

    if (!open && dialog.open) {
      dialog.close()
    }

    if (!open && wasOpenRef.current) {
      returnFocusRef.current?.focus()
      returnFocusRef.current = null
      confirmationStartedRef.current = false
    }

    wasOpenRef.current = open
  }, [open])

  useEffect(() => () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
    }
    returnFocusRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }
      event.preventDefault()
      if (!confirming) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [confirming, onCancel, open])

  function handleCancel() {
    if (!confirming) {
      onCancel()
    }
  }

  function handleConfirm() {
    if (confirming || confirmationStartedRef.current) {
      return
    }
    confirmationStartedRef.current = true
    onConfirm()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-busy={confirming}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-card border border-app-border-muted bg-app-surface-elevated p-0 text-app-primary shadow-elevated backdrop:bg-app-primary/45"
      onCancel={(event) => {
        event.preventDefault()
        handleCancel()
      }}
      onClose={() => {
        if (open && !confirming) {
          onCancel()
        }
      }}
    >
      <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6">
        <h2 id={titleId} className="break-words text-section-title text-app-primary">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 whitespace-pre-wrap break-words text-supporting text-app-secondary">
          {description}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            disabled={confirming}
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>
          <Button variant="destructive" disabled={confirming} onClick={handleConfirm}>
            {confirming ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
