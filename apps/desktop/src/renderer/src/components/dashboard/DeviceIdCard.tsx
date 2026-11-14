import { cn } from '../../lib/cn'
import { formatDeviceId } from '../../lib/recent-connections'
import { CheckIcon, CopyIcon } from '../Icons'

export interface DeviceIdCardProps {
  deviceId: string
  copied: boolean
  onCopy: () => void
}

export function DeviceIdCard({ deviceId, copied, onCopy }: DeviceIdCardProps): React.JSX.Element {
  const formattedId = deviceId ? formatDeviceId(deviceId) : '— — —'

  return (
    <section
      className="rise rounded-xl border border-line bg-surface p-3.5 shadow-xs"
      style={{ animationDelay: '60ms' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">

          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-stone-400">
              Device ID
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className="truncate font-mono text-[21px] font-semibold tracking-[0.05em] text-ink sm:text-[22px]"
                aria-busy={!deviceId}
              >
                {formattedId}
              </span>
              <button
                type="button"
                onClick={onCopy}
                disabled={!deviceId}
                aria-label={copied ? 'Device ID copied' : 'Copy device ID'}
                title={copied ? 'Copied' : 'Copy device ID'}
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-lg border transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                  copied
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-line bg-white text-stone-400 hover:border-line-strong hover:text-ink'
                )}
              >
                {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              </button>
              <span className="sr-only" role="status">
                {copied ? 'Device ID copied to clipboard' : ''}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
