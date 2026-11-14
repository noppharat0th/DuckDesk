import { cn } from '../../lib/cn'
import {
  connectionGradient,
  connectionName,
  formatDeviceId,
  type RecentConnection
} from '../../lib/recent-connections'
import { ArrowRightIcon, ArrowUpRightIcon, ClockIcon, MonitorIcon } from '../Icons'
import { DuckMark } from '../Brand'

interface RecentComputerCardProps {
  connection: RecentConnection
  onConnect: (id: string) => void
}

export function RecentComputerCard({
  connection,
  onConnect
}: RecentComputerCardProps): React.JSX.Element {
  const [from, to] = connectionGradient(connection.id)

  return (
    <button
      type="button"
      onClick={() => onConnect(connection.id)}
      className={cn(
        'group overflow-hidden rounded-xl border border-line bg-surface text-left shadow-card transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas'
      )}
      aria-label={`Connect to ${connectionName(connection)}`}
    >
      <div
        className="relative m-2 mb-0 h-[76px] overflow-hidden rounded-lg"
        style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,rgb(255_255_255/0.38),transparent_46%)]"
          aria-hidden="true"
        />
        <div
          className="dot-grid absolute inset-0 opacity-25 mix-blend-overlay"
          aria-hidden="true"
        />

        <MonitorIcon
          size={34}
          strokeWidth={1.1}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/35"
          aria-hidden="true"
        />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm">
          Remote
        </span>
        <span
          className="absolute right-1.5 top-1.5 size-2 rounded-full bg-emerald-400 ring-2 ring-black/10"
          title="Recently connected"
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-2">
        <div className="min-w-0">
          <h3 className="truncate text-[12px] font-semibold tracking-tight text-ink">
            {connectionName(connection)}
          </h3>
          <p className="mt-0.5 truncate font-mono text-[10px] tracking-[0.05em] text-stone-500">
            {formatDeviceId(connection.id)}
          </p>
        </div>
        <span className="grid size-6 shrink-0 place-items-center rounded-md text-stone-300 transition-colors group-hover:bg-brand-soft group-hover:text-amber-600">
          <ArrowUpRightIcon size={13} />
        </span>
      </div>
    </button>
  )
}

interface RecentComputersProps {
  connections: RecentConnection[]
  onConnect: (id: string) => void
  onViewAll?: () => void
}

export function RecentComputers({
  connections,
  onConnect,
  onViewAll
}: RecentComputersProps): React.JSX.Element {
  return (
    <section className="rise" style={{ animationDelay: '180ms' }}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md border border-line bg-surface text-stone-500">
          <ClockIcon size={13} />
        </span>
        <h2 className="text-[14px] font-bold tracking-tight text-ink">Recent Computers</h2>
        {connections.length > 0 ? (
          <span className="rounded-full bg-stone-200/70 px-1.5 py-0.5 text-[9px] font-bold text-stone-500">
            {connections.length}
          </span>
        ) : null}
        {onViewAll && connections.length > 0 ? (
          <button
            type="button"
            onClick={onViewAll}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-amber-700 transition hover:bg-brand-soft hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            View All
            <ArrowRightIcon size={12} />
          </button>
        ) : null}
      </div>

      {connections.length === 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line-strong bg-white/55 p-4">
          <DuckMark className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-ink">No recent computers yet</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
              Computers you connect to will appear here for quick access.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {connections.slice(0, 4).map((connection) => (
            <RecentComputerCard key={connection.id} connection={connection} onConnect={onConnect} />
          ))}
        </div>
      )}
    </section>
  )
}
