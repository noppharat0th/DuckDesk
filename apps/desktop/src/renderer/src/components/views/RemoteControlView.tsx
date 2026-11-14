import { cn } from '../../lib/cn'
import { formatDeviceId, type RecentConnection } from '../../lib/recent-connections'
import { CheckIcon, ComputersIcon, CopyIcon, RemoteControlIcon } from '../Icons'
import { Button } from '../ui/Button'
import { PageHeader } from '../ui/PageHeader'
import { ConnectPanel, type ConnectPanelProps } from '../dashboard/ConnectPanel'
import type { DeviceIdCardProps } from '../dashboard/DeviceIdCard'
import { RecentComputers } from '../dashboard/RecentComputers'

interface RemoteControlViewProps {
  device: DeviceIdCardProps
  connect: Omit<ConnectPanelProps, 'autoFocus'>
  recent: RecentConnection[]
  onConnectRecent: (id: string) => void
  onViewAll: () => void
  onBrowseComputers: () => void
}

const STEPS = [
  {
    title: 'Share your ID',
    description: 'Send your DuckDesk ID to the person who needs access to this computer.'
  },
  {
    title: 'Enter their ID',
    description: "Type your partner's 9-digit ID above and press Connect."
  },
  {
    title: 'Accept the session',
    description: 'They accept the request and a secure peer-to-peer session begins.'
  }
] as const

export function RemoteControlView({
  device,
  connect,
  recent,
  onConnectRecent,
  onViewAll,
  onBrowseComputers
}: RemoteControlViewProps): React.JSX.Element {
  return (
    <div>
      <PageHeader
        icon={<RemoteControlIcon size={18} />}
        title="Remote Control"
        description="Start a secure session with another computer using its DuckDesk ID."
        action={
          <Button variant="secondary" size="md" onClick={onBrowseComputers}>
            <ComputersIcon size={16} />
            My computers
          </Button>
        }
      />

      <div className="mt-5 grid items-start gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <ConnectPanel {...connect} autoFocus />

        <aside className="rise rounded-xl border border-line bg-surface p-4 shadow-card">
          <h2 className="text-[12px] font-bold tracking-tight text-ink">How it works</h2>
          <ol className="mt-3 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-amber-200/70 bg-brand-soft text-[10px] font-bold text-amber-700">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink">{step.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-stone-500">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-3.5 rounded-lg border border-line bg-canvas/70 p-2.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Your ID
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[12.5px] font-semibold tracking-[0.05em] text-ink">
                {device.deviceId ? formatDeviceId(device.deviceId) : '— — —'}
              </span>
              <button
                type="button"
                onClick={device.onCopy}
                disabled={!device.deviceId}
                aria-label={device.copied ? 'Device ID copied' : 'Copy device ID'}
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-md border transition',
                  device.copied
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-line bg-white text-stone-400 hover:text-ink'
                )}
              >
                {device.copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-5">
        <RecentComputers connections={recent} onConnect={onConnectRecent} onViewAll={onViewAll} />
      </div>
    </div>
  )
}
