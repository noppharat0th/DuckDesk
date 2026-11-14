import type { RecentConnection } from '../../lib/recent-connections'
import { ConnectPanel, type ConnectPanelProps } from '../dashboard/ConnectPanel'
import { DeviceIdCard, type DeviceIdCardProps } from '../dashboard/DeviceIdCard'
import { RecentComputers } from '../dashboard/RecentComputers'
import { WelcomeHero } from '../dashboard/WelcomeHero'

interface HomeViewProps {
  device: DeviceIdCardProps
  connect: Omit<ConnectPanelProps, 'autoFocus'>
  recent: RecentConnection[]
  onConnectRecent: (id: string) => void
  onViewAll: () => void
}

export function HomeView({
  device,
  connect,
  recent,
  onConnectRecent,
  onViewAll
}: HomeViewProps): React.JSX.Element {
  return (
    <div>
      <WelcomeHero />
      <div className="mt-3">
        <DeviceIdCard {...device} />
      </div>
      <div className="mt-3">
        <ConnectPanel {...connect} />
      </div>
      <div className="mt-5">
        <RecentComputers connections={recent} onConnect={onConnectRecent} onViewAll={onViewAll} />
      </div>
    </div>
  )
}
