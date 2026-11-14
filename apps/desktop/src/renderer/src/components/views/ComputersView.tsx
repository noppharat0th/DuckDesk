import type { RecentConnection } from '../../lib/recent-connections'
import { ComputersIcon, PlusIcon } from '../Icons'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { PageHeader } from '../ui/PageHeader'
import { RecentComputerCard } from '../dashboard/RecentComputers'

interface ComputersViewProps {
  connections: RecentConnection[]
  onConnect: (id: string) => void
  onAddComputer: () => void
}

function describeComputers(count: number): string {
  if (count === 0) return 'Computers you connect to are saved here for one-click access.'
  if (count === 1) return '1 saved computer. Reconnect to any computer you have used before.'
  return `${count} saved computers. Reconnect to any computer you have used before.`
}

export function ComputersView({
  connections,
  onConnect,
  onAddComputer
}: ComputersViewProps): React.JSX.Element {
  const description = describeComputers(connections.length)

  return (
    <div>
      <PageHeader
        icon={<ComputersIcon size={18} />}
        title="Computers"
        description={description}
        action={
          <Button size="md" onClick={onAddComputer}>
            <PlusIcon size={14} />
            Connect new
          </Button>
        }
      />

      <div className="mt-5">
        {connections.length === 0 ? (
          <EmptyState
            title="No saved computers yet"
            description="Once you connect to another computer, it will be saved here so you can reach it again in one click."
            action={
              <Button size="md" onClick={onAddComputer}>
                <PlusIcon size={14} />
                Connect to a computer
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {connections.map((connection) => (
              <RecentComputerCard
                key={connection.id}
                connection={connection}
                onConnect={onConnect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
