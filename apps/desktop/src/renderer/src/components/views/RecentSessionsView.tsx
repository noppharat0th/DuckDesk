import { cn } from '../../lib/cn'
import {
  connectionGradient,
  connectionName,
  formatDeviceId,
  timeAgo,
  type RecentConnection
} from '../../lib/recent-connections'
import { ArrowUpRightIcon, MonitorIcon, SessionsIcon, TrashIcon } from '../Icons'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { PageHeader } from '../ui/PageHeader'
import { ClearHistoryButton } from '../ClearHistoryButton'

interface RecentSessionsViewProps {
  connections: RecentConnection[]
  onConnect: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onBrowse: () => void
}

export function RecentSessionsView({
  connections,
  onConnect,
  onRemove,
  onClear,
  onBrowse
}: RecentSessionsViewProps): React.JSX.Element {
  return (
    <div>
      <PageHeader
        icon={<SessionsIcon size={18} />}
        title="Recent Sessions"
        description="A quick history of the computers you have connected to from DuckDesk."
        action={<ClearHistoryButton count={connections.length} onClear={onClear} />}
      />

      <div className="mt-5">
        {connections.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Your recent remote sessions will show up here once you connect to your first computer."
            action={
              <Button size="md" onClick={onBrowse}>
                <MonitorIcon size={16} />
                Find a computer
              </Button>
            }
          />
        ) : (
          <div className="rise overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            {connections.map((connection, index) => {
              const [from, to] = connectionGradient(connection.id)

              return (
                <div
                  key={connection.id}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-canvas/70',
                    index > 0 && 'border-t border-line'
                  )}
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-white/85 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    aria-hidden="true"
                  >
                    <MonitorIcon size={16} strokeWidth={1.6} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold tracking-tight text-ink">
                      {connectionName(connection)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-stone-500">
                      <span className="font-mono tracking-[0.06em]">
                        {formatDeviceId(connection.id)}
                      </span>
                      <span className="text-stone-300" aria-hidden="true">
                        •
                      </span>
                      <span className="text-stone-400">{timeAgo(connection.ts)}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(connection.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-stone-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                    aria-label={`Remove ${connectionName(connection)} from history`}
                    title="Remove from history"
                  >
                    <TrashIcon size={14} />
                  </button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onConnect(connection.id)}
                    className="hidden sm:inline-flex"
                  >
                    Connect
                    <ArrowUpRightIcon size={13} />
                  </Button>

                  <button
                    type="button"
                    onClick={() => onConnect(connection.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-white text-ink-soft transition hover:border-line-strong hover:text-ink sm:hidden"
                    aria-label={`Connect to ${connectionName(connection)}`}
                  >
                    <ArrowUpRightIcon size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
