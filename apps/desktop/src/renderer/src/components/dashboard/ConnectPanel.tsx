import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import {
  ClipboardPasteIcon,
  InfoIcon,
  MonitorIcon,
  SpinnerIcon,
  WifiIcon,
  WifiOffIcon,
  ZapIcon
} from '../Icons'

export interface ConnectPanelProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onPaste: () => void
  isOnline: boolean
  status: string
  error: string
  isHosting: boolean
  activePartnerId: string
  onStopSharing: () => void
  autoFocus?: boolean
}

export function ConnectPanel({
  value,
  onChange,
  onSubmit,
  onPaste,
  isOnline,
  status,
  error,
  isHosting,
  activePartnerId,
  onStopSharing,
  autoFocus = false
}: ConnectPanelProps): React.JSX.Element {
  const isBusy = status.length > 0
  const canConnect = isOnline && !isBusy

  return (
    <section
      className="rise rounded-xl border border-line bg-surface p-4 shadow-card"
      style={{ animationDelay: '120ms' }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-bold tracking-tight text-ink">
              Connect to Remote Computer
            </h2>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70'
              )}
            >
              {isOnline ? <WifiIcon size={11} /> : <WifiOffIcon size={11} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Enter the partner&apos;s ID to establish a connection.
          </p>
        </div>
      </div>

      {isHosting ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-800">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
          <span>
            Sharing this screen with{' '}
            <strong className="font-mono font-semibold">{activePartnerId || 'a partner'}</strong>
          </span>
          <button
            type="button"
            onClick={onStopSharing}
            className="ml-auto rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"
          >
            Stop sharing
          </button>
        </div>
      ) : null}

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="relative min-w-0 flex-1">
          <MonitorIcon
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            autoFocus={autoFocus}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Enter remote device ID…"
            aria-label="Remote device ID"
            aria-invalid={error.length > 0}
            maxLength={11}
            className={cn(
              'h-10 w-full rounded-lg border bg-canvas/60 pl-9 pr-3 font-mono text-[13px] tracking-[0.05em] text-ink',
              'placeholder:font-sans placeholder:tracking-normal placeholder:text-stone-400',
              'transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2',
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                : 'border-line focus:border-amber-300 focus:ring-amber-200'
            )}
          />
        </div>

        <Button type="submit" size="lg" disabled={!canConnect} className="sm:min-w-[120px]">
          {isBusy ? <SpinnerIcon size={14} className="animate-spin" /> : <ZapIcon size={14} />}
          {isBusy ? 'Connecting…' : 'Connect'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onPaste}
          aria-label="Paste device ID from clipboard"
          title="Paste from clipboard"
          className="hidden h-10 w-10 text-stone-500 hover:text-ink sm:inline-flex"
        >
          <ClipboardPasteIcon size={15} />
        </Button>
      </form>

      <div className="mt-2 min-h-4">
        {error ? (
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600"
            role="alert"
          >
            <InfoIcon size={12} />
            {error}
          </p>
        ) : status ? (
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700"
            role="status"
          >
            <SpinnerIcon size={12} className="animate-spin" />
            {status}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <InfoIcon size={12} />
            {isOnline
              ? 'Your partner can find their ID on their DuckDesk home screen.'
              : 'Connecting to the DuckDesk network…'}
          </p>
        )}
      </div>
    </section>
  )
}
