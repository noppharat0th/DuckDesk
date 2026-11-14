import duckMark from '../assets/duckdesk-mark.png'
import { cn } from '../lib/cn'

interface DuckMarkProps {
  className?: string
}

/** The duck mascot, framed as a soft app tile. */
export function DuckMark({ className }: DuckMarkProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-amber-200/80',
        'bg-gradient-to-br from-amber-50 via-white to-amber-100 shadow-[0_1px_2px_rgb(28_25_23/0.06)]',
        className
      )}
      aria-hidden="true"
    >
      <img
        src={duckMark}
        alt=""
        className="size-full scale-[1.04] object-cover"
        draggable={false}
      />
    </span>
  )
}

interface WordmarkProps {
  className?: string
  subtitle?: string
}

export function Wordmark({ className, subtitle }: WordmarkProps): React.JSX.Element {
  return (
    <span className={cn('flex min-w-0 flex-col', className)}>
      <span className="truncate text-[19px] font-extrabold leading-none tracking-[-0.04em] text-ink">
        Duck<span className="text-amber-500">Desk</span>
      </span>
      {subtitle ? (
        <span className="mt-1.5 truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          {subtitle}
        </span>
      ) : null}
    </span>
  )
}
