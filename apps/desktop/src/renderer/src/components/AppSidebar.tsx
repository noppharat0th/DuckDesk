import { useEffect, useRef, useState } from 'react'
import {
  // ArrowRightIcon,
  ChevronRightIcon,
  ComputersIcon,
  // CrownIcon,
  HomeIcon,
  RemoteControlIcon,
  SessionsIcon,
  SettingsIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon
} from './Icons'
import { DuckMark, Wordmark } from './Brand'
import { cn } from '../lib/cn'
import type { AppView } from './types'

interface AppSidebarProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
  recentCount: number
}

const NAV_ITEMS = [
  { view: 'home', label: 'Home', icon: HomeIcon },
  { view: 'remote', label: 'Remote Control', icon: RemoteControlIcon },
  { view: 'computers', label: 'Computers', icon: ComputersIcon },
  { view: 'sessions', label: 'Recent Sessions', icon: SessionsIcon },
  { view: 'settings', label: 'Settings', icon: SettingsIcon }
] as const

const SIDEBAR_STORAGE_KEY = 'duck-sidebar-collapsed'

export function AppSidebar({
  activeView,
  onNavigate,
  recentCount
}: AppSidebarProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const noticeTimer = useRef<number | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      // Sidebar preference is nice-to-have; ignore unavailable storage.
    }
  }, [collapsed])

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current)
    }
  }, [])

  return (
    <aside
      className={cn(
        'relative z-10 flex shrink-0 flex-col border-r border-line bg-surface pt-10 rounded-r-[30px]',
        'transition-[width] duration-300 ease-out',
        collapsed ? 'w-[76px]' : 'w-[232px]'
      )}
    >
      <div
        className={cn(
          'flex h-[64px] items-center',
          collapsed ? 'justify-center px-2' : 'px-4'
        )}
      >
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex min-w-0 items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label="DuckDesk home"
          title={collapsed ? 'DuckDesk' : undefined}
        >
          <DuckMark className="size-10" />
          {!collapsed ? <Wordmark /> : null}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2.5 pt-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.view
          const showCount = item.view === 'sessions' && recentCount > 0

          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'group flex h-9 items-center rounded-[10px] text-[12.5px] font-semibold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                collapsed
                  ? 'mx-auto w-9 justify-center px-0'
                  : 'w-full justify-start gap-2.5 px-2.5',
                isActive
                  ? 'bg-brand text-ink ring-2 ring-brand ring-offset-2 ring-offset-surface'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-ink'
              )}
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />

              {!collapsed ? (
                <>
                  <span className="truncate">{item.label}</span>
                  {showCount && !isActive ? (
                    <span className="ml-auto inline-flex min-w-4 items-center justify-center rounded-full bg-stone-100 px-1 py-0.5 text-[9px] font-semibold text-stone-500">
                      {recentCount}
                    </span>
                  ) : null}
                  {isActive ? (
                    <ChevronRightIcon size={13} className="ml-auto shrink-0 opacity-60" />
                  ) : null}
                </>
              ) : null}
            </button>
          )
        })}
      </nav>
      
      <div className="border-t border-line px-2.5 py-2">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex h-8 items-center rounded-lg text-[10.5px] font-medium text-stone-400 transition-colors',
            'hover:bg-stone-100 hover:text-ink',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            collapsed ? 'mx-auto w-8 justify-center' : 'w-full gap-2 px-2.5'
          )}
        >
          {collapsed ? (
            <SidebarExpandIcon size={15} />
          ) : (
            <>
              <SidebarCollapseIcon size={15} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
