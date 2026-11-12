import { windowChrome } from '../../../shared/window-chrome'

export default function LayoutHeader(): React.JSX.Element {
  return (
    <header
      className="titlebar flex items-center gap-2.5 ps-3.5 text-white"
      style={{ backgroundColor: windowChrome.color, height: windowChrome.height }}
    >
      <span
        className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/15 ring-1 ring-white/25"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <rect x="3.5" y="4.5" width="17" height="11.5" rx="2" />
          <path d="M8 20h8m-4-4v4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="truncate text-sm font-semibold tracking-tight">DuckDesk</span>
    </header>
  )
}
