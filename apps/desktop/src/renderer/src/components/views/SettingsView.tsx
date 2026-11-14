import { cn } from '../../lib/cn'
import { formatDeviceId } from '../../lib/recent-connections'
import { DuckMark, Wordmark } from '../Brand'
import { ClearHistoryButton } from '../ClearHistoryButton'
import {
  CheckIcon,
  CopyIcon,
  KeyIcon,
  SettingsIcon,
  ShieldCheckIcon,
  WifiIcon,
  WifiOffIcon
} from '../Icons'
import { PageHeader } from '../ui/PageHeader'
import type { DeviceIdCardProps } from '../dashboard/DeviceIdCard'

interface SettingsViewProps {
  device: DeviceIdCardProps
  isOnline: boolean
  recentCount: number
  onClearHistory: () => void
}

export function SettingsView({
  device,
  isOnline,
  recentCount,
  onClearHistory
}: SettingsViewProps): React.JSX.Element {
  return (
    <div>
      <PageHeader
        icon={<SettingsIcon size={18} />}
        title="Settings"
        description="Manage this device, your connection history and DuckDesk security."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold text-stone-500">
            <CheckIcon size={11} className="text-emerald-500" />
            Version 1.0.0
          </span>
        }
      />

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <section className="rise rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-start gap-3">
            <div>
              <h2 className="text-[13px] font-bold tracking-tight text-ink">This device</h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                The address other people use to reach this computer.
              </p>
            </div>
            <span
              className={cn(
                'ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70'
              )}
            >
              {isOnline ? <WifiIcon size={11} /> : <WifiOffIcon size={11} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="mt-4 rounded-lg border border-line bg-canvas/70 p-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Device ID
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="truncate font-mono text-[18px] font-semibold tracking-[0.05em] text-ink">
                {device.deviceId ? formatDeviceId(device.deviceId) : '— — —'}
              </span>
              <button
                type="button"
                onClick={device.onCopy}
                disabled={!device.deviceId}
                aria-label={device.copied ? 'Device ID copied' : 'Copy device ID'}
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-md border transition',
                  device.copied
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-line bg-white text-stone-400 hover:text-ink'
                )}
              >
                {device.copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              </button>
            </div>
          </div>

          <dl className="mt-3 space-y-2 text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-stone-500">
                <KeyIcon size={12} className="text-stone-400" />
                Session security
              </dt>
              <dd className="font-semibold text-ink">Peer-to-peer · encrypted</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-stone-500">
                <ShieldCheckIcon size={12} className="text-stone-400" />
                Access control
              </dt>
              <dd className="font-semibold text-ink">Approval required</dd>
            </div>
          </dl>
        </section>

        <section className="rise rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-start gap-3">
            <div>
              <h2 className="text-[13px] font-bold tracking-tight text-ink">Privacy & history</h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Connection history never leaves this computer.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-line bg-canvas/70 px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold text-ink">Saved computers</p>
              <p className="mt-0.5 text-[10px] text-stone-500">
                {recentCount === 1 ? '1 computer' : `${recentCount} computers`} in your history
              </p>
            </div>
            <span className="grid size-8 place-items-center rounded-md bg-white font-mono text-[13px] font-semibold text-ink ring-1 ring-line">
              {recentCount}
            </span>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-stone-500">
            Clearing your history removes saved IDs from this device. It does not change any access
            permissions on your partners&apos; computers.
          </p>

          <div className="mt-3">
            <ClearHistoryButton count={recentCount} onClear={onClearHistory} />
          </div>
        </section>

        <section className="rise flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5 lg:col-span-2">
          <DuckMark className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Wordmark />
              <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-500">
                v1.0.0
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-stone-500">
              Fast, secure remote access with a friendly duck. Sessions are negotiated directly
              between computers over WebRTC, so your screen data never passes through a relay.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['End-to-end encrypted', 'P2P', 'No port forwarding'].map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas/70 px-2 py-0.5 text-[9px] font-medium text-stone-500"
              >
                <CheckIcon size={10} className="text-emerald-500" />
                {feature}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
