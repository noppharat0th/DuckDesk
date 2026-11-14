import { formatDeviceId } from '../lib/recent-connections'
import { CheckIcon, CloseIcon, ScreenShareIcon, ShieldCheckIcon } from './Icons'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

interface IncomingRequestDialogProps {
  request: { fromId: string } | null
  onAccept: () => void
  onDecline: () => void
}

export function IncomingRequestDialog({
  request,
  onAccept,
  onDecline
}: IncomingRequestDialogProps): React.JSX.Element | null {
  if (!request) return null

  return (
    <Modal
      open
      onClose={onDecline}
      title="Incoming connection request"
      description="Someone wants to view and control this screen."
      size="sm"
    >
      <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/70 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-amber-200/70 bg-brand-soft text-brand-ink">
          <ScreenShareIcon size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-[16px] font-semibold tracking-[0.05em] text-ink">
            {formatDeviceId(request.fromId)}
          </p>
          <p className="text-[10px] text-stone-500">Remote device · requesting control</p>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-50/70 px-2.5 py-2 text-[10px] leading-relaxed text-emerald-800">
        <ShieldCheckIcon size={12} className="mt-0.5 shrink-0" />
        Only accept if you trust this person. You can disconnect at any time.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="lg" onClick={onDecline}>
          <CloseIcon size={13} />
          Decline
        </Button>
        <Button size="lg" onClick={onAccept}>
          <CheckIcon size={14} />
          Accept
        </Button>
      </div>
    </Modal>
  )
}
